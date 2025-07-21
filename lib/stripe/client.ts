'use client'

import { loadStripe, Stripe } from '@stripe/stripe-js'

// Stripeクライアントインスタンス（シングルトン）
let stripePromise: Promise<Stripe | null>

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('Stripe publishable key is not set')
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey, {
      locale: 'ja',
      apiVersion: '2024-12-18.acacia',
    })
  }

  return stripePromise
}

// Stripe Elements設定
export const stripeElementsOptions = {
  // 外観設定
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb', // blue-600
      colorBackground: '#ffffff',
      colorText: '#1f2937', // gray-800
      colorDanger: '#dc2626', // red-600
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
    rules: {
      '.Input': {
        border: '1px solid #d1d5db', // gray-300
        padding: '10px 12px',
        fontSize: '14px',
      },
      '.Input:focus': {
        borderColor: '#2563eb', // blue-600
        boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)',
      },
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151', // gray-700
        marginBottom: '6px',
      },
    },
  },
  // ローダー設定
  loader: 'auto' as const,
}

// 決済フォーム用Elements設定
export const paymentElementOptions = {
  layout: {
    type: 'tabs' as const,
    defaultCollapsed: false,
  },
  paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
  business: {
    name: 'City2',
  },
  fields: {
    billingDetails: {
      name: 'auto' as const,
      email: 'auto' as const,
      phone: 'auto' as const,
      address: 'auto' as const,
    },
  },
  terms: {
    card: 'auto' as const,
  },
}

// エラーハンドリング
export class StripeClientError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string
  ) {
    super(message)
    this.name = 'StripeClientError'
  }
}

// Stripeエラーのハンドリング
export function handleStripeError(error: unknown): StripeClientError {
  if (error && typeof error === 'object' && 'type' in error) {
    const stripeError = error as { type: string; message?: string; code?: string }
    
    if (stripeError.type === 'card_error') {
      return new StripeClientError(
        stripeError.message || 'カード情報に問題があります。',
        stripeError.code,
        'card_error'
      )
    }

    if (stripeError.type === 'validation_error') {
      return new StripeClientError(
        stripeError.message || '入力内容に問題があります。',
        stripeError.code,
        'validation_error'
      )
    }

    if (stripeError.type === 'authentication_error') {
      return new StripeClientError(
        '認証が必要です。カード会社の指示に従ってください。',
        stripeError.code,
        'authentication_error'
      )
    }

    if (stripeError.type === 'rate_limit_error') {
      return new StripeClientError(
        'リクエストが多すぎます。しばらくしてからお試しください。',
        stripeError.code,
        'rate_limit_error'
      )
    }
    
    // その他のエラー（型があるオブジェクト）
    return new StripeClientError(
      stripeError.message || '決済処理中にエラーが発生しました。しばらくしてからお試しください。',
      stripeError.code || 'unknown',
      stripeError.type || 'unknown'
    )
  }

  // エラーオブジェクトではない場合
  return new StripeClientError(
    '予期しないエラーが発生しました。',
    'unknown',
    'unknown'
  )
}

// 決済完了後のリダイレクト処理
export function redirectToSuccess(sessionId?: string) {
  const params = new URLSearchParams()
  if (sessionId) {
    params.set('session_id', sessionId)
  }
  params.set('payment', 'success')
  
  window.location.href = `/dashboard?${params.toString()}`
}

export function redirectToCancel() {
  const params = new URLSearchParams()
  params.set('payment', 'canceled')
  
  window.location.href = `/premium?${params.toString()}`
}

// 価格フォーマット（フロントエンド用）
export function formatPriceDisplay(amount: number, currency: string = 'jpy'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: currency.toLowerCase() === 'jpy' ? 0 : 2,
  }).format(amount)
}

// 期間表示のフォーマット
export function formatIntervalDisplay(interval: string, intervalCount: number = 1): string {
  const intervals: Record<string, string> = {
    'day': '日',
    'week': '週',
    'month': 'ヶ月',
    'year': '年',
  }
  
  const unit = intervals[interval] || interval
  return intervalCount === 1 ? unit : `${intervalCount}${unit}`
}

// サブスクリプション状態の日本語表示
export function formatSubscriptionStatus(status: string): { text: string; color: string } {
  const statusMap: Record<string, { text: string; color: string }> = {
    'active': { text: 'アクティブ', color: 'text-green-600' },
    'trialing': { text: 'トライアル中', color: 'text-blue-600' },
    'past_due': { text: '支払い期限超過', color: 'text-yellow-600' },
    'canceled': { text: 'キャンセル済み', color: 'text-red-600' },
    'unpaid': { text: '未払い', color: 'text-red-600' },
    'incomplete': { text: '不完全', color: 'text-gray-600' },
    'incomplete_expired': { text: '期限切れ', color: 'text-gray-600' },
    'paused': { text: '一時停止', color: 'text-gray-600' },
  }
  
  return statusMap[status] || { text: status, color: 'text-gray-600' }
}