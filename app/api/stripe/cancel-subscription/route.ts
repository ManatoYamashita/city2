import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/config'
import { z } from 'zod'

const cancelSubscriptionSchema = z.object({
  subscription_id: z.string().min(1, 'Subscription IDは必須です'),
  immediately: z.boolean().optional().default(false),
})

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
    const { subscription_id, immediately } = cancelSubscriptionSchema.parse(body)

    // サブスクリプションの所有者チェック
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription_id)
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'サブスクリプションが見つかりません' },
        { status: 404 }
      )
    }

    // 既にキャンセル済みかチェック
    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'このサブスクリプションは既にキャンセル済みです' },
        { status: 400 }
      )
    }

    let updatedSubscription

    if (immediately) {
      // 即座にキャンセル
      updatedSubscription = await stripe.subscriptions.cancel(subscription_id)
    } else {
      // 期間終了時にキャンセル
      updatedSubscription = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      })
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        canceled_at: updatedSubscription.canceled_at 
          ? new Date(updatedSubscription.canceled_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { error: 'サブスクリプション情報の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      subscription_id: updatedSubscription.id,
      status: updatedSubscription.status,
      cancel_at_period_end: updatedSubscription.cancel_at_period_end,
      canceled_at: updatedSubscription.canceled_at,
      current_period_end: (updatedSubscription as { current_period_end?: number }).current_period_end,
    })

  } catch (error) {
    console.error('Subscription cancellation error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'サブスクリプションのキャンセルに失敗しました' },
      { status: 500 }
    )
  }
}