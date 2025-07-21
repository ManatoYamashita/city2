import { Stripe } from 'stripe'

// Stripeサブスクリプション関連型定義
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  stripe_price_id: string
  features: string[]
  popular?: boolean
  trial_days?: number
}

export interface SubscriptionCreateRequest {
  price_id: string
  trial_days?: number
  payment_method_id?: string
  return_url?: string
}

export interface SubscriptionUpdateRequest {
  subscription_id: string
  price_id?: string
  cancel_at_period_end?: boolean
  proration_behavior?: 'create_prorations' | 'none' | 'always_invoice'
}

export interface CustomerPortalRequest {
  customer_id: string
  return_url?: string
}

export interface WebhookEvent {
  id: string
  object: 'event'
  api_version: string
  created: number
  data: {
    object: any
    previous_attributes?: any
  }
  livemode: boolean
  pending_webhooks: number
  request: {
    id: string | null
    idempotency_key: string | null
  } | null
  type: string
}

// データベース用サブスクリプション型
export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
  price_id: string
  current_period_start: string
  current_period_end: string
  trial_start?: string
  trial_end?: string
  cancel_at_period_end: boolean
  canceled_at?: string
  created_at: string
  updated_at: string
}

export interface BillingHistory {
  id: string
  user_id: string
  stripe_invoice_id: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  description?: string
  invoice_url?: string
  hosted_invoice_url?: string
  created_at: string
}

// Stripe顧客情報
export interface StripeCustomer {
  id: string
  user_id: string
  stripe_customer_id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

// プレミアム機能制限
export interface PremiumLimits {
  free: {
    reviews_per_month: number
    searches_per_day: number
    advanced_filters: boolean
    export_data: boolean
    detailed_analytics: boolean
  }
  premium: {
    reviews_per_month: number
    searches_per_day: number
    advanced_filters: boolean
    export_data: boolean
    detailed_analytics: boolean
  }
}

// 決済関連レスポンス型
export interface SubscriptionResponse {
  subscription: Subscription
  client_secret?: string
  requires_action?: boolean
}

export interface CheckoutSessionResponse {
  session_id: string
  url: string
}

export interface CustomerPortalResponse {
  url: string
}

// Webhook処理用型
export interface StripeEventHandler {
  'customer.subscription.created': (subscription: Stripe.Subscription) => Promise<void>
  'customer.subscription.updated': (subscription: Stripe.Subscription) => Promise<void>
  'customer.subscription.deleted': (subscription: Stripe.Subscription) => Promise<void>
  'invoice.payment_succeeded': (invoice: Stripe.Invoice) => Promise<void>
  'invoice.payment_failed': (invoice: Stripe.Invoice) => Promise<void>
  'customer.created': (customer: Stripe.Customer) => Promise<void>
  'customer.updated': (customer: Stripe.Customer) => Promise<void>
}

export type StripeEventType = keyof StripeEventHandler

// エラー型
export interface StripeError {
  type: 'card_error' | 'authentication_error' | 'api_error' | 'rate_limit_error' | 'validation_error' | 'idempotency_error'
  code?: string
  message: string
  param?: string
  decline_code?: string
  charge?: string
  payment_intent?: string
  payment_method?: string
  setup_intent?: string
  source?: string
}

export interface BillingDetails {
  address?: {
    city?: string
    country?: string
    line1?: string
    line2?: string
    postal_code?: string
    state?: string
  }
  email?: string
  name?: string
  phone?: string
}

// サブスクリプションプラン設定
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '無料プラン',
    description: '基本的な授業レビュー機能',
    price: 0,
    currency: 'jpy',
    interval: 'month',
    stripe_price_id: '',
    features: [
      '月5件のレビュー投稿',
      '基本的な授業検索',
      '標準レビュー表示',
    ],
  },
  {
    id: 'premium_monthly',
    name: 'プレミアム（月額）',
    description: '全機能無制限利用',
    price: 980,
    currency: 'jpy',
    interval: 'month',
    stripe_price_id: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    features: [
      '無制限レビュー投稿',
      '高度な検索・フィルタリング',
      '詳細統計・分析',
      'PDF/CSVエクスポート',
      '広告非表示',
      '優先サポート',
    ],
    popular: true,
    trial_days: 7,
  },
  {
    id: 'premium_yearly',
    name: 'プレミアム（年額）',
    description: '全機能無制限利用（2ヶ月分お得）',
    price: 9800,
    currency: 'jpy',
    interval: 'year',
    stripe_price_id: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    features: [
      '無制限レビュー投稿',
      '高度な検索・フィルタリング',
      '詳細統計・分析',
      'PDF/CSVエクスポート',
      '広告非表示',
      '優先サポート',
      '年額2ヶ月分割引',
    ],
    trial_days: 7,
  },
]

export const PREMIUM_LIMITS: PremiumLimits = {
  free: {
    reviews_per_month: 5,
    searches_per_day: 50,
    advanced_filters: false,
    export_data: false,
    detailed_analytics: false,
  },
  premium: {
    reviews_per_month: -1, // 無制限
    searches_per_day: -1, // 無制限
    advanced_filters: true,
    export_data: true,
    detailed_analytics: true,
  },
}