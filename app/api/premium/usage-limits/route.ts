import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { premiumLimitCheckSchema } from '@/lib/validations/stripe'
import { PREMIUM_LIMITS } from '@/types/stripe'
import { authHelpers } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
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

    // URLパラメータから feature を取得
    const { searchParams } = new URL(request.url)
    const feature = searchParams.get('feature')

    if (!feature || !['reviews_per_month', 'searches_per_day'].includes(feature)) {
      return NextResponse.json(
        { error: '有効な機能名を指定してください' },
        { status: 400 }
      )
    }

    // プレミアムユーザーかチェック
    const isPremium = await authHelpers.isPremiumUser(user.id)

    if (isPremium) {
      // プレミアムユーザーは無制限
      return NextResponse.json({
        limit: -1,
        used: 0,
        remaining: -1,
        reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_premium: true,
      })
    }

    // 無料ユーザーの制限をチェック
    const limit = PREMIUM_LIMITS.free[feature as keyof typeof PREMIUM_LIMITS.free]
    
    // リセット日の計算
    const now = new Date()
    let resetDate: Date
    
    if (feature === 'reviews_per_month') {
      // 月初にリセット
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    } else {
      // 日付が変わるとリセット
      resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    }

    // 現在の使用量を取得
    const { data: usageData } = await supabase
      .from('usage_limits')
      .select('used_count')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .gte('reset_date', now.toISOString())
      .single()

    const used = usageData?.used_count || 0
    const remaining = Math.max(0, (limit as number) - used)

    return NextResponse.json({
      limit,
      used,
      remaining,
      reset_date: resetDate.toISOString(),
      is_premium: false,
    })

  } catch (error) {
    console.error('Usage limit check error:', error)
    return NextResponse.json(
      { error: '使用量制限の確認に失敗しました' },
      { status: 500 }
    )
  }
}

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
    const { feature, increment } = premiumLimitCheckSchema.parse({
      ...body,
      user_id: user.id,
    })

    // プレミアムユーザーかチェック
    const isPremium = await authHelpers.isPremiumUser(user.id)

    if (isPremium) {
      // プレミアムユーザーは制限なし
      await supabase
        .from('premium_feature_logs')
        .insert({
          user_id: user.id,
          feature,
          action: 'increment',
          metadata: { increment, premium: true },
        })

      return NextResponse.json({
        allowed: true,
        limit: -1,
        used: 0,
        remaining: -1,
        is_premium: true,
      })
    }

    // 無料ユーザーの制限をチェック
    const limit = PREMIUM_LIMITS.free[feature as keyof typeof PREMIUM_LIMITS.free]
    
    if (limit === false) {
      // この機能はプレミアム限定
      return NextResponse.json({
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        is_premium: false,
        error: 'この機能はプレミアムプランでのみ利用可能です',
      })
    }

    // リセット日の計算
    const now = new Date()
    let resetDate: Date
    
    if (feature === 'reviews_per_month') {
      // 月初にリセット
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    } else {
      // 日付が変わるとリセット
      resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    }

    // 現在の使用量を取得または作成
    const { data: usageData } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .gte('reset_date', now.toISOString())
      .single()

    let currentUsage = 0

    if (usageData) {
      currentUsage = usageData.used_count
    } else {
      // 新しい使用量レコードを作成
      await supabase
        .from('usage_limits')
        .insert({
          user_id: user.id,
          feature,
          used_count: 0,
          reset_date: resetDate.toISOString(),
        })
    }

    // 制限チェック
    if (currentUsage + increment > (limit as number)) {
      return NextResponse.json({
        allowed: false,
        limit,
        used: currentUsage,
        remaining: Math.max(0, (limit as number) - currentUsage),
        is_premium: false,
        error: '使用量の上限に達しました。プレミアムプランにアップグレードしてください。',
      })
    }

    // 使用量を更新
    const { error: updateError } = await supabase
      .from('usage_limits')
      .update({
        used_count: currentUsage + increment,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('feature', feature)
      .gte('reset_date', now.toISOString())

    if (updateError) {
      console.error('Failed to update usage:', updateError)
      return NextResponse.json(
        { error: '使用量の更新に失敗しました' },
        { status: 500 }
      )
    }

    // ログ記録
    await supabase
      .from('premium_feature_logs')
      .insert({
        user_id: user.id,
        feature,
        action: 'increment',
        metadata: { increment, premium: false },
      })

    const newUsage = currentUsage + increment
    const remaining = Math.max(0, (limit as number) - newUsage)

    return NextResponse.json({
      allowed: true,
      limit,
      used: newUsage,
      remaining,
      is_premium: false,
    })

  } catch (error) {
    console.error('Usage increment error:', error)
    return NextResponse.json(
      { error: '使用量の更新に失敗しました' },
      { status: 500 }
    )
  }
}