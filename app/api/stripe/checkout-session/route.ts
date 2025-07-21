import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, stripeConfig } from '@/lib/stripe/config'
import { checkoutSessionSchema } from '@/lib/validations/stripe'

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
    const validatedData = checkoutSessionSchema.parse(body)

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

    let customer_id = validatedData.customer_id

    if (!stripeCustomer && !customer_id) {
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

      customer_id = customer.id
      stripeCustomer = newCustomer
    } else if (stripeCustomer) {
      customer_id = stripeCustomer.stripe_customer_id
    }

    // チェックアウトセッションのパラメータ
    const sessionParams: Record<string, unknown> = {
      customer: customer_id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: validatedData.price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: validatedData.success_url,
      cancel_url: validatedData.cancel_url,
      allow_promotion_codes: validatedData.allow_promotion_codes,
      billing_address_collection: validatedData.billing_address_collection,
      customer_update: validatedData.customer_update,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    }

    // トライアル期間の設定
    if (validatedData.trial_period_days && validatedData.trial_period_days > 0) {
      (sessionParams.subscription_data as Record<string, unknown>).trial_period_days = validatedData.trial_period_days
    }

    // チェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create(sessionParams as any)

    return NextResponse.json({
      session_id: session.id,
      url: session.url,
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'チェックアウトセッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}