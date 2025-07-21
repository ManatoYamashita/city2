'use client'

import React, { useState } from 'react'
import { Check, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/stripe'
import { formatPriceDisplay, formatIntervalDisplay } from '@/lib/stripe/client'
import { useSubscription } from '@/hooks/useSubscription'

interface SubscriptionPlansProps {
  onPlanSelect?: (plan: SubscriptionPlan) => void
  showCurrentPlan?: boolean
  className?: string
}

export function SubscriptionPlans({ 
  onPlanSelect, 
  showCurrentPlan = true,
  className 
}: SubscriptionPlansProps) {
  const { subscription, isPremium, createSubscription } = useSubscription()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      return // 無料プランは何もしない
    }

    try {
      setLoadingPlan(plan.id)
      
      if (onPlanSelect) {
        onPlanSelect(plan)
      } else {
        // デフォルトの処理：チェックアウトセッションを作成
        const response = await fetch('/api/stripe/checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            price_id: plan.stripe_price_id,
            success_url: `${window.location.origin}/dashboard?payment=success`,
            cancel_url: `${window.location.origin}/premium?payment=canceled`,
            trial_period_days: plan.trial_days,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'チェックアウトセッションの作成に失敗しました')
        }

        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Plan selection error:', error)
      alert(error instanceof Error ? error.message : 'プランの選択中にエラーが発生しました')
    } finally {
      setLoadingPlan(null)
    }
  }

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      return !isPremium
    }
    return subscription?.price_id === plan.stripe_price_id
  }

  const getButtonText = (plan: SubscriptionPlan) => {
    if (loadingPlan === plan.id) return '処理中...'
    if (plan.id === 'free') return '現在のプラン'
    if (isCurrentPlan(plan)) return '現在のプラン'
    if (plan.trial_days && plan.trial_days > 0) return `${plan.trial_days}日間無料で試す`
    return 'このプランを選択'
  }

  const getButtonVariant = (plan: SubscriptionPlan) => {
    if (plan.id === 'free' || isCurrentPlan(plan)) return 'outline'
    return plan.popular ? 'default' : 'outline'
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {SUBSCRIPTION_PLANS.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${
            isCurrentPlan(plan) ? 'ring-2 ring-green-500' : ''
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-3 py-1">
                <Star size={14} className="mr-1" />
                人気
              </Badge>
            </div>
          )}

          {isCurrentPlan(plan) && showCurrentPlan && (
            <div className="absolute -top-3 right-4">
              <Badge className="bg-green-500 text-white px-3 py-1">
                <Check size={14} className="mr-1" />
                現在のプラン
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
              {plan.id !== 'free' && <Zap size={20} className="text-yellow-500" />}
              {plan.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {plan.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 価格表示 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {formatPriceDisplay(plan.price)}
              </div>
              {plan.price > 0 && (
                <div className="text-sm text-gray-500">
                  /{formatIntervalDisplay(plan.interval)}
                </div>
              )}
              {plan.trial_days && plan.trial_days > 0 && plan.price > 0 && (
                <div className="text-sm text-blue-600 font-medium mt-1">
                  {plan.trial_days}日間無料トライアル
                </div>
              )}
            </div>

            {/* 機能リスト */}
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* アクションボタン */}
            <Button
              className="w-full"
              variant={getButtonVariant(plan)}
              onClick={() => handlePlanSelect(plan)}
              disabled={
                loadingPlan === plan.id || 
                (plan.id === 'free') ||
                isCurrentPlan(plan)
              }
            >
              {getButtonText(plan)}
            </Button>

            {/* 追加情報 */}
            {plan.price > 0 && (
              <div className="text-xs text-gray-500 text-center">
                <p>いつでもキャンセル可能</p>
                {plan.interval === 'year' && (
                  <p className="text-green-600 font-medium">年額プランで2ヶ月分お得！</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// プラン比較テーブル用コンポーネント
export function PlanComparisonTable() {
  const features = [
    { name: 'レビュー投稿', free: '月5件まで', premium: '無制限' },
    { name: '授業検索', free: '基本検索', premium: '高度な検索・フィルタ' },
    { name: '統計・分析', free: '基本統計', premium: '詳細分析' },
    { name: 'データエクスポート', free: '×', premium: 'PDF/CSV対応' },
    { name: '広告表示', free: 'あり', premium: 'なし' },
    { name: 'サポート', free: '標準', premium: '優先対応' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 p-4 text-left font-semibold">機能</th>
            <th className="border border-gray-200 p-4 text-center font-semibold">無料プラン</th>
            <th className="border border-gray-200 p-4 text-center font-semibold bg-blue-50 text-blue-700">
              プレミアムプラン
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-200 p-4 font-medium">{feature.name}</td>
              <td className="border border-gray-200 p-4 text-center text-gray-600">
                {feature.free}
              </td>
              <td className="border border-gray-200 p-4 text-center text-blue-700 font-medium">
                {feature.premium}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}