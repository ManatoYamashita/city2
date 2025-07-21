'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, TrendingUp, BarChart3, Download } from 'lucide-react'
import { SubscriptionPlans, PlanComparisonTable } from '@/components/subscription/SubscriptionPlans'
import { SubscriptionProvider } from '@/components/stripe/StripeProvider'
import { useSubscription } from '@/hooks/useSubscription'

export default function PremiumPage() {
  const { isPremium, subscription } = useSubscription()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-900">プレミアムプラン</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          より高度な機能で、あなたの学習体験を最大化しましょう
        </p>
        {isPremium && (
          <Badge className="mt-4 bg-green-500 text-white px-6 py-2 text-lg">
            <Star className="w-4 h-4 mr-2" />
            現在プレミアムユーザーです
          </Badge>
        )}
      </div>

      {/* プレミアム機能紹介 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-5 h-5" />
              高度な検索・分析
            </CardTitle>
            <CardDescription>
              より詳細な条件での授業検索と、統計データの分析機能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                複数条件での詳細検索
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                評価トレンドの可視化
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                人気授業の推薦機能
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <BarChart3 className="w-5 h-5" />
              詳細レポート
            </CardTitle>
            <CardDescription>
              パーソナライズされた学習分析レポート
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-green-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                履修パターン分析
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                成績予測モデル
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                学習計画の最適化
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Download className="w-5 h-5" />
              データエクスポート
            </CardTitle>
            <CardDescription>
              レビューデータの出力とバックアップ機能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-purple-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                PDFレポート出力
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                CSVデータエクスポート
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                クラウドバックアップ
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* プラン比較 */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          プラン比較
        </h2>
        <PlanComparisonTable />
      </div>

      {/* サブスクリプションプラン */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          プランを選択
        </h2>
        <SubscriptionProvider>
          <SubscriptionPlans 
            showCurrentPlan={true}
            onPlanSelect={(plan) => {
              // プラン選択時の処理（デフォルトはチェックアウトページへリダイレクト）
              window.location.href = `/checkout?plan=${plan.id}`
            }}
          />
        </SubscriptionProvider>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          よくある質問
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">無料トライアルはありますか？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                はい、プレミアムプランには7日間の無料トライアルが付いています。
                トライアル期間中はいつでもキャンセル可能で、料金は発生しません。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">いつでもキャンセルできますか？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                はい、契約の縛りは一切ありません。ダッシュボードからいつでも
                簡単にキャンセルできます。キャンセル後も期間満了まではプレミアム機能をご利用いただけます。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">データの安全性は保証されますか？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                はい、すべてのデータは暗号化され、業界標準のセキュリティ対策で保護されています。
                決済情報はStripeにより安全に処理され、当社では保存していません。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">プラン変更はできますか？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                はい、月額プランと年額プランの間での変更が可能です。
                変更は次回の請求タイミングから適用されます。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      {!isPremium && (
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">
                今すぐプレミアムプランを始めよう
              </h3>
              <p className="text-lg mb-6 opacity-90">
                7日間無料トライアルで、すべてのプレミアム機能をお試しください
              </p>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/checkout?plan=premium'}
              >
                無料トライアルを開始
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}