import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, stripeConfig, verifyWebhookSignature } from '@/lib/stripe/config'
import Stripe from 'stripe'

// Webhookイベントハンドラー
async function handleCustomerSubscriptionCreated(subscription: Stripe.Subscription) {
  const supabase = await createClient()
  const userId = subscription.metadata.user_id

  if (!userId) {
    console.error('User ID not found in subscription metadata')
    return
  }

  // サブスクリプション情報をデータベースに保存
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id || '',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    })

  if (error) {
    console.error('Failed to save subscription:', error)
    throw new Error('Failed to save subscription to database')
  }

  console.log(`Subscription created for user ${userId}: ${subscription.id}`)
}

async function handleCustomerSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createClient()

  // データベースのサブスクリプション情報を更新
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: subscription.items.data[0]?.price.id || '',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription:', error)
    throw new Error('Failed to update subscription in database')
  }

  console.log(`Subscription updated: ${subscription.id}`)
}

async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient()

  // サブスクリプションステータスを更新
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription as canceled:', error)
    throw new Error('Failed to update subscription as canceled')
  }

  console.log(`Subscription deleted: ${subscription.id}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = await createClient()

  // サブスクリプション情報から user_id を取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!subscription) {
    console.error('Subscription not found for invoice:', invoice.id)
    return
  }

  // 請求履歴を保存
  const { error } = await supabase
    .from('billing_history')
    .insert({
      user_id: subscription.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      description: invoice.description,
      invoice_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    })

  if (error) {
    console.error('Failed to save billing history:', error)
    throw new Error('Failed to save billing history')
  }

  console.log(`Invoice payment succeeded: ${invoice.id}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await createClient()

  // サブスクリプション情報から user_id を取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single()

  if (!subscription) {
    console.error('Subscription not found for invoice:', invoice.id)
    return
  }

  // 失敗した請求履歴を保存
  const { error } = await supabase
    .from('billing_history')
    .insert({
      user_id: subscription.user_id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'uncollectible',
      description: invoice.description || '決済に失敗しました',
      invoice_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    })

  if (error) {
    console.error('Failed to save failed billing history:', error)
    throw new Error('Failed to save failed billing history')
  }

  console.log(`Invoice payment failed: ${invoice.id}`)
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  const supabase = await createClient()
  const userId = customer.metadata.user_id

  if (!userId) {
    console.error('User ID not found in customer metadata')
    return
  }

  // Stripe顧客情報をデータベースに保存
  const { error } = await supabase
    .from('stripe_customers')
    .upsert({
      user_id: userId,
      stripe_customer_id: customer.id,
      email: customer.email || '',
      name: customer.name,
    })

  if (error) {
    console.error('Failed to save customer:', error)
    throw new Error('Failed to save customer to database')
  }

  console.log(`Customer created: ${customer.id}`)
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  const supabase = await createClient()

  // 顧客情報を更新
  const { error } = await supabase
    .from('stripe_customers')
    .update({
      email: customer.email || '',
      name: customer.name,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id)

  if (error) {
    console.error('Failed to update customer:', error)
    throw new Error('Failed to update customer in database')
  }

  console.log(`Customer updated: ${customer.id}`)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Webhook署名を検証
    const event = verifyWebhookSignature(body, signature, stripeConfig.webhookSecret)

    console.log(`Received webhook event: ${event.type}`)

    // イベントタイプに応じて処理
    switch (event.type) {
      case 'customer.subscription.created':
        await handleCustomerSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('signature')) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}