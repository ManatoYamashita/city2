import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminAuth, logAdminAction } from '@/lib/auth/admin'
import { stripe } from '@/lib/stripe/config'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 管理者認証チェック（admin以上が必要）
    const adminUser = await requireAdminAuth('admin')
    const supabase = await createClient()

    const { action } = await request.json()
    const subscriptionId = params.id

    // サブスクリプションの存在確認
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        profiles:user_id (email)
      `)
      .eq('id', subscriptionId)
      .single()

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'サブスクリプションが見つかりません' },
        { status: 404 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'cancel_subscription':
        result = await cancelSubscription(supabase, subscription)
        break
      case 'retry_invoice':
        result = await retryInvoice(subscription)
        break
      case 'send_invoice':
        result = await sendInvoice(subscription)
        break
      case 'refund_last_payment':
        result = await refundLastPayment(subscription)
        break
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        )
    }

    // アクションをログに記録
    await logAdminAction(
      adminUser.id,
      action,
      'subscription',
      subscriptionId,
      { 
        user_email: subscription.profiles?.email,
        stripe_subscription_id: subscription.stripe_subscription_id,
        result 
      }
    )

    return NextResponse.json({
      success: true,
      action,
      subscription_id: subscriptionId,
      result,
    })

  } catch (error) {
    console.error('Admin payment action error:', error)
    return NextResponse.json(
      { error: 'アクションの実行に失敗しました' },
      { status: 500 }
    )
  }
}

async function cancelSubscription(supabase: any, subscription: any) {
  const { stripe_subscription_id } = subscription

  // Stripeでサブスクリプションをキャンセル
  const canceledSubscription = await stripe.subscriptions.cancel(stripe_subscription_id)

  // データベースの状態を更新
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  if (error) throw error

  return { 
    message: 'サブスクリプションをキャンセルしました',
    stripe_status: canceledSubscription.status,
    canceled_at: canceledSubscription.canceled_at 
  }
}

async function retryInvoice(subscription: any) {
  const { stripe_subscription_id } = subscription

  // 最新の未払い請求書を取得
  const invoices = await stripe.invoices.list({
    subscription: stripe_subscription_id,
    status: 'open',
    limit: 1,
  })

  if (invoices.data.length === 0) {
    return { message: '未払いの請求書が見つかりません' }
  }

  const invoice = invoices.data[0]

  // 請求書の支払いを再試行
  const paidInvoice = await stripe.invoices.pay(invoice.id)

  return { 
    message: '請求書の支払いを再試行しました',
    invoice_id: paidInvoice.id,
    status: paidInvoice.status,
    amount: paidInvoice.amount_paid 
  }
}

async function sendInvoice(subscription: any) {
  const { stripe_subscription_id, stripe_customer_id } = subscription

  // 最新の請求書を取得
  const invoices = await stripe.invoices.list({
    subscription: stripe_subscription_id,
    limit: 1,
  })

  if (invoices.data.length === 0) {
    return { message: '請求書が見つかりません' }
  }

  const invoice = invoices.data[0]

  // 請求書をメール送信
  const sentInvoice = await stripe.invoices.sendInvoice(invoice.id)

  return { 
    message: '請求書をメール送信しました',
    invoice_id: sentInvoice.id,
    customer_email: sentInvoice.customer_email 
  }
}

async function refundLastPayment(subscription: any) {
  const { stripe_subscription_id } = subscription

  // 最新の支払い済み請求書を取得
  const invoices = await stripe.invoices.list({
    subscription: stripe_subscription_id,
    status: 'paid',
    limit: 1,
  })

  if (invoices.data.length === 0) {
    return { message: '返金可能な支払いが見つかりません' }
  }

  const invoice = invoices.data[0]
  
  if (!invoice.payment_intent) {
    return { message: '支払い情報が見つかりません' }
  }

  // PaymentIntentから返金を作成
  const refund = await stripe.refunds.create({
    payment_intent: invoice.payment_intent as string,
    reason: 'requested_by_customer',
  })

  return { 
    message: '最新の支払いを返金しました',
    refund_id: refund.id,
    amount: refund.amount,
    status: refund.status 
  }
}