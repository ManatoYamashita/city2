import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { PaymentManagementData, PaymentFilters } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック（admin以上が必要）
    const adminUser = await requireAdminAuth('admin')
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as PaymentFilters['status']
    const plan = searchParams.get('plan')
    const amountMin = searchParams.get('amount_min')
    const amountMax = searchParams.get('amount_max')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // サブスクリプション情報を取得
    let query = supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        price_id,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created_at,
        profiles:user_id (email)
      `)

    // 検索条件を適用
    if (search) {
      // ユーザーのメールアドレスで検索
      query = query.or(`profiles.email.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // ページネーション
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: subscriptions, error: subscriptionsError, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (subscriptionsError) {
      throw subscriptionsError
    }

    // 各サブスクリプションの詳細情報を取得
    const paymentsWithDetails = await Promise.all(
      (subscriptions || []).map(async (subscription: any) => {
        // プラン情報を取得（実際の実装では設定から取得）
        const planName = getPlanName(subscription.price_id)
        const amount = getPlanAmount(subscription.price_id)
        const currency = 'jpy'

        return {
          id: subscription.id,
          user_email: subscription.profiles?.email || 'Unknown',
          subscription_id: subscription.stripe_subscription_id,
          status: subscription.status,
          plan_name: planName,
          amount: amount,
          currency: currency,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          created_at: subscription.created_at,
        } as PaymentManagementData
      })
    )

    // 金額フィルターを適用
    let filteredPayments = paymentsWithDetails

    if (amountMin) {
      const minAmount = parseFloat(amountMin)
      filteredPayments = filteredPayments.filter(payment => payment.amount >= minAmount)
    }

    if (amountMax) {
      const maxAmount = parseFloat(amountMax)
      filteredPayments = filteredPayments.filter(payment => payment.amount <= maxAmount)
    }

    if (plan) {
      filteredPayments = filteredPayments.filter(payment => 
        payment.plan_name.toLowerCase().includes(plan.toLowerCase())
      )
    }

    // 総収益を計算
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)

    return NextResponse.json({
      payments: filteredPayments,
      total_count: count || 0,
      page,
      page_size: pageSize,
      total_revenue: totalRevenue,
      filters_applied: {
        search,
        status,
        plan,
        amount_min: amountMin,
        amount_max: amountMax,
        date_from: dateFrom,
        date_to: dateTo,
      },
    })

  } catch (error) {
    console.error('Admin payments API error:', error)
    return NextResponse.json(
      { error: '決済データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// プラン名を取得するヘルパー関数（実際の実装では設定から取得）
function getPlanName(priceId: string): string {
  const planNames: Record<string, string> = {
    'price_premium_monthly': 'プレミアム（月額）',
    'price_premium_yearly': 'プレミアム（年額）',
  }
  return planNames[priceId] || 'Unknown Plan'
}

// プラン金額を取得するヘルパー関数（実際の実装では設定から取得）
function getPlanAmount(priceId: string): number {
  const planAmounts: Record<string, number> = {
    'price_premium_monthly': 980,
    'price_premium_yearly': 9800,
  }
  return planAmounts[priceId] || 0
}