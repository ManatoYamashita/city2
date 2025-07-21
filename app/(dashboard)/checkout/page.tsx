'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/stripe'
import { SubscriptionProvider } from '@/components/stripe/StripeProvider'
import { SimpleCheckoutForm } from '@/components/stripe/CheckoutForm'
import { useSubscription } from '@/hooks/useSubscription'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan')
  const { isPremium } = useSubscription()
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (planId) {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
      if (plan) {
        setSelectedPlan(plan)
      } else {
        setError('指定されたプランが見つかりませんでした')
      }
    } else {
      setError('プランが指定されていません')
    }
  }, [planId])

  // 既にプレミアムユーザーの場合
  if (isPremium) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">既にプレミアムユーザーです</h2>
              <p className="text-gray-600">
                現在プレミアムプランをご利用中です。
                プラン変更をご希望の場合は、ダッシュボードの請求管理ページからお手続きください。
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                  ダッシュボードに戻る
                </Button>
                <Button onClick={() => window.location.href = '/dashboard/billing'}>
                  請求管理
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !selectedPlan) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/premium'}>
                プランページに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/premium'}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          プランページに戻る
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">決済手続き</h1>
        <p className="text-gray-600 mt-2">
          {selectedPlan.name}の申し込み手続きを行います
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* プラン詳細 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>選択されたプラン</CardTitle>
              <CardDescription>以下の内容で申し込みを行います</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{selectedPlan.description}</p>
                <div className="mt-3">
                  <span className="text-2xl font-bold">
                    ¥{selectedPlan.price.toLocaleString()}
                  </span>
                  {selectedPlan.price > 0 && (
                    <span className="text-gray-500 ml-1">
                      /{selectedPlan.interval === 'month' ? '月' : '年'}
                    </span>
                  )}
                </div>
                {selectedPlan.trial_days && selectedPlan.trial_days > 0 && (
                  <div className="text-blue-600 font-medium text-sm mt-2">
                    {selectedPlan.trial_days}日間無料トライアル付き
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3">含まれる機能</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedPlan.trial_days && selectedPlan.trial_days > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">無料トライアルについて</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {selectedPlan.trial_days}日間は料金が発生しません</li>
                    <li>• トライアル期間中はいつでもキャンセル可能</li>
                    <li>• トライアル終了後、自動的に有料プランに移行</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 決済フォーム */}
        <div>
          <SubscriptionProvider>
            <SimpleCheckoutForm
              plan={selectedPlan}
              onSuccess={() => {
                window.location.href = '/dashboard?payment=success'
              }}
              onCancel={() => {
                window.location.href = '/premium?payment=canceled'
              }}
            />
          </SubscriptionProvider>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="mt-8">
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-900 mb-3">お支払いに関するご注意</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• 決済はStripeにより安全に処理されます</li>
              <li>• クレジットカード情報は当サービスでは保存されません</li>
              <li>• 請求書は登録されたメールアドレスに送信されます</li>
              <li>• プランの変更・キャンセルはダッシュボードから行えます</li>
              <li>• ご不明な点がございましたら、サポートまでお問い合わせください</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">読み込み中...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}