import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { BillingHistory } from '@/types/stripe'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーのサブスクリプション情報を取得
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'サブスクリプション情報が見つかりません' },
        { status: 404 }
      )
    }

    // Stripeから請求履歴を取得
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 100,
      expand: ['data.payment_intent'],
    })

    // レスポンス用のデータに変換
    const billingHistory: Omit<BillingHistory, 'user_id'>[] = invoices.data.map(invoice => ({
      id: invoice.id || '',
      amount: invoice.total,
      currency: invoice.currency,
      status: (invoice.status || 'draft') as BillingHistory['status'],
      description: invoice.description || invoice.lines.data[0]?.description || undefined,
      created_at: new Date(invoice.created * 1000).toISOString(),
      invoice_url: invoice.hosted_invoice_url || undefined,
      hosted_invoice_url: invoice.hosted_invoice_url || undefined,
      stripe_invoice_id: invoice.id || '',
    }))

    return NextResponse.json({
      success: true,
      history: billingHistory,
    })

  } catch (error) {
    console.error('Failed to fetch billing history:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : '請求履歴の取得に失敗しました' 
      },
      { status: 500 }
    )
  }
}