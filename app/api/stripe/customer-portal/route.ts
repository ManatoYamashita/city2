import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, stripeConfig } from '@/lib/stripe/config'
import { customerPortalSchema } from '@/lib/validations/stripe'

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
    const { return_url } = body

    // Stripe顧客情報を取得
    const { data: stripeCustomer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (customerError || !stripeCustomer) {
      return NextResponse.json(
        { error: 'Stripe顧客情報が見つかりません。まずサブスクリプションを作成してください。' },
        { status: 404 }
      )
    }

    // デフォルトのリターンURL
    const defaultReturnUrl = `${stripeConfig.app.domain}/dashboard/billing`
    const portalReturnUrl = return_url || defaultReturnUrl

    // 顧客ポータルセッションを作成
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      return_url: portalReturnUrl,
    })

    return NextResponse.json({
      url: portalSession.url,
    })

  } catch (error) {
    console.error('Customer portal error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '顧客ポータルの作成に失敗しました' },
      { status: 500 }
    )
  }
}