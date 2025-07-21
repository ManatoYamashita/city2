import { z } from 'zod'

// サブスクリプション作成用スキーマ
export const subscriptionCreateSchema = z.object({
  price_id: z.string().min(1, 'Price IDは必須です'),
  trial_days: z.number().min(0).max(365).optional(),
  payment_method_id: z.string().optional(),
  return_url: z.string().url('有効なURLを入力してください').optional(),
})

// サブスクリプション更新用スキーマ
export const subscriptionUpdateSchema = z.object({
  subscription_id: z.string().min(1, 'Subscription IDは必須です'),
  price_id: z.string().optional(),
  cancel_at_period_end: z.boolean().optional(),
  proration_behavior: z.enum(['create_prorations', 'none', 'always_invoice']).optional(),
})

// 顧客ポータル用スキーマ
export const customerPortalSchema = z.object({
  customer_id: z.string().min(1, 'Customer IDは必須です'),
  return_url: z.string().url('有効なURLを入力してください').optional(),
})

// Stripe Webhook用スキーマ
export const webhookEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  api_version: z.string(),
  created: z.number(),
  data: z.object({
    object: z.any(),
    previous_attributes: z.any().optional(),
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.string().nullable(),
    idempotency_key: z.string().nullable(),
  }).nullable(),
  type: z.string(),
})

// 請求先情報用スキーマ
export const billingDetailsSchema = z.object({
  address: z.object({
    city: z.string().optional(),
    country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
    line1: z.string().optional(),
    line2: z.string().optional(),
    postal_code: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  name: z.string().min(1, '名前は必須です').optional(),
  phone: z.string().optional(),
})

// チェックアウトセッション作成用スキーマ
export const checkoutSessionSchema = z.object({
  price_id: z.string().min(1, 'Price IDは必須です'),
  customer_id: z.string().optional(),
  success_url: z.string().url('有効なURLを入力してください'),
  cancel_url: z.string().url('有効なURLを入力してください'),
  trial_period_days: z.number().min(0).max(365).optional(),
  allow_promotion_codes: z.boolean().optional().default(true),
  billing_address_collection: z.enum(['auto', 'required']).optional().default('auto'),
  customer_update: z.object({
    address: z.enum(['auto', 'never']).optional(),
    name: z.enum(['auto', 'never']).optional(),
    shipping: z.enum(['auto', 'never']).optional(),
  }).optional(),
})

// チェックアウトセッション作成用（簡易版）
export const checkoutSessionCreateSchema = z.object({
  price_id: z.string().min(1, 'Price IDは必須です'),
  success_url: z.string().url('有効なURLを入力してください'),
  cancel_url: z.string().url('有効なURLを入力してください'),
  trial_period_days: z.number().min(0).max(365).optional(),
})

// サブスクリプション状態確認用スキーマ
export const subscriptionStatusSchema = z.object({
  user_id: z.string().uuid('有効なUser IDを入力してください'),
})

// 決済履歴取得用スキーマ
export const billingHistorySchema = z.object({
  user_id: z.string().uuid('有効なUser IDを入力してください'),
  limit: z.number().min(1).max(100).optional().default(20),
  starting_after: z.string().optional(),
})

// プレミアム機能制限チェック用スキーマ
export const premiumLimitCheckSchema = z.object({
  user_id: z.string().uuid('有効なUser IDを入力してください'),
  feature: z.enum([
    'reviews_per_month',
    'searches_per_day',
    'advanced_filters',
    'export_data',
    'detailed_analytics'
  ]),
  increment: z.number().min(0).optional().default(1),
})

// Stripe顧客作成用スキーマ
export const stripeCustomerCreateSchema = z.object({
  user_id: z.string().uuid('有効なUser IDを入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(1, '名前は必須です').optional(),
  phone: z.string().optional(),
  address: z.object({
    city: z.string().optional(),
    country: z.string().length(2).optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    postal_code: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  metadata: z.record(z.string()).optional(),
})

// プラン変更用スキーマ
export const planChangeSchema = z.object({
  subscription_id: z.string().min(1, 'Subscription IDは必須です'),
  new_price_id: z.string().min(1, '新しいPrice IDは必須です'),
  proration_behavior: z.enum(['create_prorations', 'none', 'always_invoice']).optional().default('create_prorations'),
})

// 使用量制限レスポンス用スキーマ
export const usageLimitResponseSchema = z.object({
  limit: z.number(),
  used: z.number(),
  remaining: z.number(),
  reset_date: z.string().datetime(),
  is_premium: z.boolean(),
})

// Stripeエラー用スキーマ
export const stripeErrorSchema = z.object({
  type: z.enum(['card_error', 'authentication_error', 'api_error', 'rate_limit_error', 'validation_error', 'idempotency_error']),
  code: z.string().optional(),
  message: z.string(),
  param: z.string().optional(),
  decline_code: z.string().optional(),
  charge: z.string().optional(),
  payment_intent: z.string().optional(),
  payment_method: z.string().optional(),
  setup_intent: z.string().optional(),
  source: z.string().optional(),
})

// 型エクスポート
export type SubscriptionCreateRequest = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdateRequest = z.infer<typeof subscriptionUpdateSchema>
export type CustomerPortalRequest = z.infer<typeof customerPortalSchema>
export type WebhookEventRequest = z.infer<typeof webhookEventSchema>
export type BillingDetailsRequest = z.infer<typeof billingDetailsSchema>
export type CheckoutSessionRequest = z.infer<typeof checkoutSessionSchema>
export type CheckoutSessionCreateRequest = z.infer<typeof checkoutSessionCreateSchema>
export type SubscriptionStatusRequest = z.infer<typeof subscriptionStatusSchema>
export type BillingHistoryRequest = z.infer<typeof billingHistorySchema>
export type PremiumLimitCheckRequest = z.infer<typeof premiumLimitCheckSchema>
export type StripeCustomerCreateRequest = z.infer<typeof stripeCustomerCreateSchema>
export type PlanChangeRequest = z.infer<typeof planChangeSchema>
export type UsageLimitResponse = z.infer<typeof usageLimitResponseSchema>
export type StripeErrorResponse = z.infer<typeof stripeErrorSchema>