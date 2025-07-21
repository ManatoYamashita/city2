import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, stripeConfig } from '@/lib/stripe/config'
import { subscriptionCreateSchema } from '@/lib/validations/stripe'
import { authHelpers } from '@/lib/auth/helpers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // リクエストボディの検証
    const body = await request.json()
    const validatedData = subscriptionCreateSchema.parse(body)

    // 既存のアクティブなサブスクリプションをチェック
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSub) {
      return NextResponse.json(
        { error: '既にアクティブなサブスクリプションが存在します' },
        { status: 400 }
      )
    }

    // Stripe顧客の取得または作成
    let { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!stripeCustomer) {
      // Stripe顧客を作成
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
        },
      })

      // データベースに保存
      const { data: newCustomer, error: customerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: customer.id,
          email: user.email!,
        })
        .select()
        .single()

      if (customerError) {
        throw new Error('顧客情報の保存に失敗しました')
      }

      stripeCustomer = newCustomer
    }

    // サブスクリプション作成のパラメータ
    const subscriptionParams: Record<string, unknown> = {
      customer: stripeCustomer.stripe_customer_id,
      items: [{ price: validatedData.price_id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user.id,
      },
    }

    // トライアル期間の設定
    if (validatedData.trial_days && validatedData.trial_days > 0) {
      subscriptionParams.trial_period_days = validatedData.trial_days
    }

    // 既存の支払い方法が指定されている場合
    if (validatedData.payment_method_id) {
      subscriptionParams.default_payment_method = validatedData.payment_method_id
    }

    // Stripeサブスクリプションを作成
    const subscription = await stripe.subscriptions.create(subscriptionParams as any)

    // データベースに保存
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomer.stripe_customer_id,
        status: subscription.status,
        price_id: validatedData.price_id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
      })

    if (dbError) {
      // Stripe側のサブスクリプションもキャンセル
      await stripe.subscriptions.cancel(subscription.id)
      throw new Error('サブスクリプション情報の保存に失敗しました')
    }

    // レスポンスデータの準備
    const responseData: Record<string, unknown> = {
      subscription_id: subscription.id,
      status: subscription.status,
      client_secret: null,
      requires_action: false,
    }

    // 決済が必要な場合はclient_secretを含める
    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice
      if (invoice.payment_intent && typeof invoice.payment_intent === 'object') {
        const paymentIntent = invoice.payment_intent
        responseData.client_secret = paymentIntent.client_secret
        responseData.requires_action = paymentIntent.status === 'requires_action'
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Subscription creation error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'サブスクリプションの作成に失敗しました' },
      { status: 500 }
    )
  }
}