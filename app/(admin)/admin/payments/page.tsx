'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, 
  Search, 
  Filter, 
  MoreHorizontal,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  Download,
  TrendingUp,
  Users
} from 'lucide-react'
import { PaymentManagementData, PaymentFilters } from '@/types/admin'

interface PaymentActionsProps {
  payment: PaymentManagementData
  onAction: (action: string, paymentId: string) => void
}

function PaymentActions({ payment, onAction }: PaymentActionsProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowActions(!showActions)}
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>
      
      {showActions && (
        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-48">
          <div className="p-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                window.open(`https://dashboard.stripe.com/subscriptions/${payment.subscription_id}`, '_blank')
                setShowActions(false)
              }}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Stripeで確認
            </Button>

            {payment.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-yellow-600"
                onClick={() => {
                  if (confirm('このサブスクリプションをキャンセルしますか？')) {
                    onAction('cancel_subscription', payment.id)
                    setShowActions(false)
                  }
                }}
              >
                <X className="w-4 h-4 mr-2" />
                サブスクリプション停止
              </Button>
            )}

            {payment.status === 'past_due' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-blue-600"
                onClick={() => {
                  onAction('retry_invoice', payment.id)
                  setShowActions(false)
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                請求再試行
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onAction('send_invoice', payment.id)
                setShowActions(false)
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              請求書送信
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600"
              onClick={() => {
                onAction('refund_last_payment', payment.id)
                setShowActions(false)
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              最新支払いを返金
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentManagementData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: undefined,
  })

  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [page, filters])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.plan && { plan: filters.plan }),
        ...(filters.amount_min && { amount_min: filters.amount_min.toString() }),
        ...(filters.amount_max && { amount_max: filters.amount_max.toString() }),
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to }),
      })

      const response = await fetch(`/api/admin/payments?${queryParams}`)
      if (!response.ok) {
        throw new Error('決済データの取得に失敗しました')
      }

      const data = await response.json()
      setPayments(data.payments)
      setTotalCount(data.total_count)
      setTotalRevenue(data.total_revenue)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch payments:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }))
    setPage(1)
  }

  const handleAction = async (action: string, paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('アクションの実行に失敗しました')
      }

      // データを再取得
      await fetchPayments()
      
      alert('アクションが正常に実行されました')
    } catch (err) {
      console.error('Failed to execute action:', err)
      alert(err instanceof Error ? err.message : 'アクションの実行に失敗しました')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />アクティブ</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />トライアル</Badge>
      case 'past_due':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />支払い遅延</Badge>
      case 'canceled':
        return <Badge className="bg-red-500"><X className="w-3 h-3 mr-1" />キャンセル</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            決済管理
          </h1>
          <p className="text-gray-600 mt-2">
            サブスクリプションと決済の管理
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchPayments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
          <Button variant="outline" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
            <CreditCard className="w-4 h-4 mr-2" />
            Stripeダッシュボード
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総収益</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-600 mt-1">
              フィルター適用後の合計
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">サブスクリプション数</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              フィルター適用後の件数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均月額</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount > 0 ? formatCurrency(totalRevenue / totalCount) : '¥0'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              1サブスクリプションあたり
            </p>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            フィルター・検索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="ユーザーメールで検索"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <Select value={filters.status || ''} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, status: value || undefined }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="active">アクティブ</SelectItem>
                <SelectItem value="trialing">トライアル</SelectItem>
                <SelectItem value="past_due">支払い遅延</SelectItem>
                <SelectItem value="canceled">キャンセル</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.plan || ''} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, plan: value || undefined }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="プラン" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="premium_monthly">プレミアム（月額）</SelectItem>
                <SelectItem value="premium_yearly">プレミアム（年額）</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="最小金額"
                value={filters.amount_min || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amount_min: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
              <Input
                type="number"
                placeholder="最大金額"
                value={filters.amount_max || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  amount_max: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 決済リスト */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>決済一覧</CardTitle>
              <CardDescription>
                {totalCount.toLocaleString()}件の決済（{page}ページ / {totalPages}ページ）
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              エラー: {error}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              条件に一致する決済が見つかりません
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                    <div className="md:col-span-2">
                      <p className="font-medium">{payment.user_email}</p>
                      <p className="text-sm text-gray-500">{payment.plan_name}</p>
                    </div>

                    <div className="text-center">
                      {getStatusBadge(payment.status)}
                    </div>

                    <div className="text-center">
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{payment.currency.toUpperCase()}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm">
                        {new Date(payment.current_period_start).toLocaleDateString('ja-JP')}
                      </p>
                      <p className="text-xs text-gray-500">開始日</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm">
                        {new Date(payment.current_period_end).toLocaleDateString('ja-JP')}
                      </p>
                      <p className="text-xs text-gray-500">次回更新</p>
                    </div>

                    <div className="text-center">
                      {payment.cancel_at_period_end ? (
                        <Badge variant="outline" className="text-yellow-600">
                          期間満了で終了
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          自動更新
                        </Badge>
                      )}
                    </div>
                  </div>

                  <PaymentActions payment={payment} onAction={handleAction} />
                </div>
              ))}
            </div>
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                前のページ
              </Button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                次のページ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}