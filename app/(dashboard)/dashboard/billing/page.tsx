'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Calendar, 
  Download, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { BillingHistory } from '@/types/stripe'
import { formatPriceDisplay, formatIntervalDisplay } from '@/lib/stripe/client'

interface BillingPageState {
  billingHistory: BillingHistory[]
  loadingHistory: boolean
  loadingAction: string | null
  error: string | null
}

export default function BillingPage() {
  const { 
    subscription, 
    loading, 
    error: subscriptionError, 
    isPremium, 
    cancelSubscription, 
    openCustomerPortal 
  } = useSubscription()

  const [state, setState] = useState<BillingPageState>({
    billingHistory: [],
    loadingHistory: true,
    loadingAction: null,
    error: null
  })

  // 請求履歴を取得
  useEffect(() => {
    const fetchBillingHistory = async () => {
      try {
        const response = await fetch('/api/stripe/billing-history')
        if (!response.ok) {
          throw new Error('請求履歴の取得に失敗しました')
        }
        const data = await response.json()
        setState(prev => ({
          ...prev,
          billingHistory: data.history || [],
          loadingHistory: false
        }))
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : '請求履歴の取得に失敗しました',
          loadingHistory: false
        }))
      }
    }

    if (isPremium) {
      fetchBillingHistory()
    } else {
      setState(prev => ({ ...prev, loadingHistory: false }))
    }
  }, [isPremium])

  const handleCancelSubscription = async () => {
    if (!subscription) return

    const confirmed = window.confirm(
      'サブスクリプションをキャンセルしますか？\n\n' +
      '期間満了までプレミアム機能は引き続きご利用いただけますが、' +
      '次回の更新は行われません。'
    )

    if (!confirmed) return

    try {
      setState(prev => ({ ...prev, loadingAction: 'cancel' }))
      await cancelSubscription(false) // 即座にキャンセルしない
      alert('サブスクリプションがキャンセルされました。期間満了までプレミアム機能をご利用いただけます。')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'キャンセルに失敗しました')
    } finally {
      setState(prev => ({ ...prev, loadingAction: null }))
    }
  }

  const handleOpenCustomerPortal = async () => {
    try {
      setState(prev => ({ ...prev, loadingAction: 'portal' }))
      await openCustomerPortal()
    } catch (err) {
      alert(err instanceof Error ? err.message : '顧客ポータルの起動に失敗しました')
    } finally {
      setState(prev => ({ ...prev, loadingAction: null }))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />有効</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />トライアル中</Badge>
      case 'past_due':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />支払い遅延</Badge>
      case 'canceled':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />キャンセル済み</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">請求管理</h1>
        <p className="text-gray-600 mt-2">
          サブスクリプションと請求に関する情報を管理できます
        </p>
      </div>

      {(subscriptionError || state.error) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {subscriptionError || state.error}
          </AlertDescription>
        </Alert>
      )}

      {/* 現在のプラン */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            現在のプラン
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isPremium ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">無料プラン</h3>
              <p className="text-gray-600 mb-4">
                基本的な機能をご利用いただけます
              </p>
              <Button onClick={() => window.location.href = '/premium'}>
                プレミアムプランにアップグレード
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">プレミアムプラン</h3>
                  <p className="text-gray-600">すべての機能をご利用いただけます</p>
                </div>
                {subscription && getStatusBadge(subscription.status)}
              </div>

              {subscription && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">料金:</span>
                      <span className="font-medium">
                        プレミアムプラン
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">開始日:</span>
                      <span>{new Date(subscription.current_period_start).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">次回更新:</span>
                      <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleOpenCustomerPortal}
                      disabled={state.loadingAction === 'portal'}
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {state.loadingAction === 'portal' ? '起動中...' : '請求設定を管理'}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>

                    {subscription.status === 'active' && (
                      <Button
                        variant="outline"
                        onClick={handleCancelSubscription}
                        disabled={state.loadingAction === 'cancel'}
                        className="w-full"
                      >
                        {state.loadingAction === 'cancel' ? 'キャンセル中...' : 'サブスクリプションをキャンセル'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 請求履歴 */}
      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              請求履歴
            </CardTitle>
            <CardDescription>
              過去の支払い記録とダウンロード
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.loadingHistory ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : state.billingHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                まだ請求履歴がありません
              </div>
            ) : (
              <div className="space-y-3">
                {state.billingHistory.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {formatPriceDisplay(bill.amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(bill.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          className={
                            bill.status === 'paid' 
                              ? 'bg-green-500' 
                              : bill.status === 'open'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }
                        >
                          {bill.status === 'paid' ? '支払い済み' : 
                           bill.status === 'open' ? '支払い待ち' : '未払い'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {bill.description || 'プレミアムプラン'}
                      </p>
                    </div>
                    {bill.invoice_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={bill.invoice_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          領収書
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ヘルプ */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>サポート</CardTitle>
          <CardDescription>
            請求に関するお困りごとがございましたら、お気軽にお問い合わせください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">よくある質問</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• プランの変更方法</li>
                <li>• 領収書の発行</li>
                <li>• キャンセルのタイミング</li>
                <li>• 返金ポリシー</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <a href="/support" target="_blank">
                  サポートページ
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:support@city2.example.com">
                  メールでお問い合わせ
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}