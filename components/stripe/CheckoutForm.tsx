'use client'

import React, { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Shield } from 'lucide-react'
import { SubscriptionPlan } from '@/types/stripe'
import { formatPriceDisplay, formatIntervalDisplay } from '@/lib/stripe/client'

interface CheckoutFormProps {
  plan: SubscriptionPlan
  clientSecret: string
  customerId?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

export function CheckoutForm({
  plan,
  clientSecret,
  customerId,
  onSuccess,
  onError,
  className,
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return
    }

    // クライアントシークレットが変更されたらエラーをクリア
    setError(null)
  }, [stripe, clientSecret])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('決済システムの初期化中です。しばらくお待ちください。')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // フォームバリデーション
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || '入力内容に問題があります。')
        return
      }

      // 決済を確認
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
        redirect: 'if_required', // リダイレクトを最小限に
      })

      if (confirmError) {
        if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
          setError(confirmError.message || '決済に失敗しました。')
        } else {
          setError('予期しないエラーが発生しました。しばらくしてからお試しください。')
        }
        onError?.(confirmError.message || '決済に失敗しました。')
      } else {
        // 決済成功
        setIsComplete(true)
        onSuccess?.()
      }
    } catch (err) {
      console.error('Payment error:', err)
      const errorMessage = err instanceof Error ? err.message : '決済処理中にエラーが発生しました。'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">決済が完了しました！</h3>
              <p className="text-gray-600 mt-2">
                {plan.name}にアップグレードされました。プレミアム機能をお楽しみください。
              </p>
            </div>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              ダッシュボードに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard size={20} />
          決済情報の入力
        </CardTitle>
        <CardDescription>
          {plan.name} - {formatPriceDisplay(plan.price)}/{formatIntervalDisplay(plan.interval)}
          {plan.trial_days && plan.trial_days > 0 && (
            <span className="text-blue-600 font-medium ml-2">
              ({plan.trial_days}日間無料トライアル)
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* エラー表示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 決済要素 */}
          <div>
            <PaymentElement
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                fields: {
                  billingDetails: {
                    name: 'auto',
                    email: 'auto',
                    phone: 'auto',
                    address: 'auto',
                  },
                },
                terms: {
                  card: 'auto',
                },
              }}
            />
          </div>

          {/* セキュリティ情報 */}
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Shield size={16} className="text-gray-500" />
            <span>
              お客様の決済情報は暗号化され、安全に処理されます。
              クレジットカード情報は保存されません。
            </span>
          </div>

          {/* トライアル情報 */}
          {plan.trial_days && plan.trial_days > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">無料トライアルについて</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {plan.trial_days}日間は無料でご利用いただけます</li>
                <li>• トライアル期間中はいつでもキャンセル可能です</li>
                <li>• トライアル終了後に自動的に課金が開始されます</li>
              </ul>
            </div>
          )}

          {/* 決済ボタン */}
          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || !elements || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading
              ? '決済処理中...'
              : plan.trial_days && plan.trial_days > 0
              ? `${plan.trial_days}日間無料で始める`
              : `${formatPriceDisplay(plan.price)}で申し込む`
            }
          </Button>

          {/* 利用規約 */}
          <p className="text-xs text-gray-500 text-center">
            決済を完了することで、
            <a href="/terms" className="text-blue-600 hover:underline">利用規約</a>
            および
            <a href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</a>
            に同意したものとみなされます。
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

// シンプルな決済フォーム（モーダル用）
interface SimpleCheckoutFormProps {
  plan: SubscriptionPlan
  onSuccess?: () => void
  onCancel?: () => void
}

export function SimpleCheckoutForm({ plan, onSuccess, onCancel }: SimpleCheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: plan.stripe_price_id,
            trial_days: plan.trial_days,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'サブスクリプションの作成に失敗しました')
        }

        const { client_secret } = await response.json()
        setClientSecret(client_secret)
      } catch (err) {
        console.error('Failed to create subscription:', err)
        setError(err instanceof Error ? err.message : 'サブスクリプションの作成に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [plan])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">決済情報を準備中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !clientSecret) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error || '決済情報の準備に失敗しました'}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              キャンセル
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              再試行
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <CheckoutForm
      plan={plan}
      clientSecret={clientSecret}
      onSuccess={onSuccess}
      onError={(error) => setError(error)}
    />
  )
}