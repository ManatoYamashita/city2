import Stripe from 'stripe'

// Stripe設定
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// 環境変数チェック
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const

export function validateStripeConfig() {
  const missing = requiredEnvVars.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all Stripe keys are set.'
    )
  }
}

// Stripe設定値
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
  secretKey: process.env.STRIPE_SECRET_KEY as string,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
  
  // プライス設定（環境変数から取得）
  prices: {
    premiumMonthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID as string,
    premiumYearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID as string,
  },
  
  // アプリケーション設定
  app: {
    name: 'City2',
    domain: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@city2.app',
  },
  
  // Webhook設定
  webhooks: {
    endpoint: '/api/stripe/webhooks',
    events: [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.created',
      'customer.updated',
    ] as const,
  },
  
  // 顧客ポータル設定
  customerPortal: {
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'phone', 'address'],
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
      },
      subscription_pause: {
        enabled: false,
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        products: [
          {
            product: process.env.STRIPE_PREMIUM_PRODUCT_ID as string,
            prices: [
              process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID as string,
              process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID as string,
            ].filter(Boolean),
          },
        ].filter(product => product.product),
      },
    },
  },
  
  // チェックアウト設定
  checkout: {
    success_url: '/dashboard?payment=success',
    cancel_url: '/premium?payment=canceled',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_creation: 'always',
    mode: 'subscription',
    payment_method_types: ['card'],
    locale: 'ja',
  },
  
  // 試用期間設定
  trial: {
    days: 7,
    enabled: true,
  },
} as const

// Stripeエラーメッセージの日本語化
export const stripeErrorMessages: Record<string, string> = {
  // カードエラー
  'card_declined': 'カードが拒否されました。別のカードをお試しください。',
  'insufficient_funds': '残高不足のため決済できませんでした。',
  'lost_card': 'このカードは無効です。別のカードをお試しください。',
  'stolen_card': 'このカードは無効です。別のカードをお試しください。',
  'expired_card': 'カードの有効期限が切れています。',
  'incorrect_cvc': 'セキュリティコードが正しくありません。',
  'incorrect_number': 'カード番号が正しくありません。',
  'invalid_cvc': 'セキュリティコードが無効です。',
  'invalid_expiry_month': '有効期限の月が無効です。',
  'invalid_expiry_year': '有効期限の年が無効です。',
  'invalid_number': 'カード番号が無効です。',
  'processing_error': '決済処理中にエラーが発生しました。しばらくしてからお試しください。',
  
  // 認証エラー
  'authentication_required': '認証が必要です。カード会社の指示に従ってください。',
  
  // APIエラー
  'api_key_expired': 'システムエラーが発生しました。サポートにお問い合わせください。',
  'rate_limit': 'リクエストが多すぎます。しばらくしてからお試しください。',
  
  // バリデーションエラー
  'missing': '必須項目が入力されていません。',
  'email_invalid': 'メールアドレスの形式が正しくありません。',
  
  // デフォルトメッセージ
  'default': '決済処理中にエラーが発生しました。しばらくしてからお試しください。',
}

// Stripeエラーの日本語メッセージ取得
export function getStripeErrorMessage(error: Stripe.StripeError): string {
  return stripeErrorMessages[error.code || 'default'] || stripeErrorMessages.default
}

// 通貨フォーマット（日本円）
export function formatPrice(amount: number, currency: string = 'jpy'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: currency.toLowerCase() === 'jpy' ? 0 : 2,
  }).format(amount)
}

// 間隔表示の日本語化
export function formatInterval(interval: string): string {
  const intervals: Record<string, string> = {
    'day': '日',
    'week': '週',
    'month': '月',
    'year': '年',
  }
  return intervals[interval] || interval
}

// Webhook署名検証
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    throw new Error('Webhook signature verification failed')
  }
}

// プロダクション環境チェック
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// テストモードチェック
export function isTestMode(): boolean {
  return !isProduction() || stripeConfig.secretKey.startsWith('sk_test_')
}