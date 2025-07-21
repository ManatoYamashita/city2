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
    const userId = params.id

    // ユーザーの存在確認
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    let result: any = {}

    switch (action) {
      case 'suspend':
        result = await suspendUser(supabase, userId)
        break
      case 'activate':
        result = await activateUser(supabase, userId)
        break
      case 'delete':
        result = await deleteUser(supabase, userId)
        break
      case 'reset_password':
        result = await resetPassword(supabase, user.email)
        break
      case 'upgrade_to_premium':
        result = await upgradeToPremium(supabase, userId)
        break
      case 'downgrade_to_free':
        result = await downgradeToFree(supabase, userId)
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
      'user',
      userId,
      { user_email: user.email, result }
    )

    return NextResponse.json({
      success: true,
      action,
      user_id: userId,
      result,
    })

  } catch (error) {
    console.error('Admin user action error:', error)
    return NextResponse.json(
      { error: 'アクションの実行に失敗しました' },
      { status: 500 }
    )
  }
}

async function suspendUser(supabase: any, userId: string) {
  // ユーザー状態を停止に変更
  const { error } = await supabase
    .from('user_status')
    .upsert({
      user_id: userId,
      status: 'suspended',
      reason: '管理者による停止',
      updated_at: new Date().toISOString(),
    })

  if (error) throw error

  return { message: 'ユーザーを停止しました' }
}

async function activateUser(supabase: any, userId: string) {
  // ユーザー状態をアクティブに変更
  const { error } = await supabase
    .from('user_status')
    .upsert({
      user_id: userId,
      status: 'active',
      reason: '管理者による再開',
      updated_at: new Date().toISOString(),
    })

  if (error) throw error

  return { message: 'ユーザーを再開しました' }
}

async function deleteUser(supabase: any, userId: string) {
  // ユーザー状態を削除済みに変更（物理削除は行わない）
  const { error } = await supabase
    .from('user_status')
    .upsert({
      user_id: userId,
      status: 'deleted',
      reason: '管理者による削除',
      updated_at: new Date().toISOString(),
    })

  if (error) throw error

  // アクティブなサブスクリプションがあればキャンセル
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single()

  if (subscription?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
    } catch (stripeError) {
      console.error('Failed to cancel subscription:', stripeError)
    }
  }

  return { message: 'ユーザーを削除しました' }
}

async function resetPassword(supabase: any, email: string) {
  // Supabaseの管理者APIを使用してパスワードリセットメールを送信
  const { error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  })

  if (error) throw error

  return { message: 'パスワードリセットメールを送信しました' }
}

async function upgradeToPremium(supabase: any, userId: string) {
  // プレミアムプランの価格IDを取得（実際の実装では設定から取得）
  const premiumPriceId = 'price_premium_monthly' // 実際の価格ID

  // Stripe顧客を取得または作成
  const { data: user } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('ユーザーが見つかりません')

  // Stripe顧客の作成
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { user_id: userId },
  })

  // サブスクリプションの作成
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: premiumPriceId }],
    metadata: { user_id: userId },
  })

  // データベースに保存
  const { error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      status: subscription.status,
      price_id: premiumPriceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })

  if (error) throw error

  return { message: 'プレミアムプランにアップグレードしました', subscription_id: subscription.id }
}

async function downgradeToFree(supabase: any, userId: string) {
  // アクティブなサブスクリプションを取得
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .single()

  if (!subscription?.stripe_subscription_id) {
    return { message: 'アクティブなサブスクリプションが見つかりません' }
  }

  // Stripeでサブスクリプションをキャンセル
  await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

  // データベースの状態を更新
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.stripe_subscription_id)

  if (error) throw error

  return { message: 'プレミアムプランをキャンセルしました' }
}