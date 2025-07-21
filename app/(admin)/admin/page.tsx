'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Settings,
  Activity,
  Database,
  Server
} from 'lucide-react'
import { AdminDashboardStats, AdminActionLog, SystemHealth } from '@/types/admin'

interface DashboardData {
  stats: AdminDashboardStats
  recent_actions: AdminActionLog[]
  system_health: SystemHealth
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    // 30秒ごとにデータを更新
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (!response.ok) {
        throw new Error('ダッシュボードデータの取得に失敗しました')
      }
      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-lg font-semibold">エラーが発生しました</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchDashboardData}>再試行</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="text-gray-600 mt-2">システム全体の概要と管理機能</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDashboardData}>
            <Activity className="w-4 h-4 mr-2" />
            更新
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/settings">
              <Settings className="w-4 h-4 mr-2" />
              設定
            </a>
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.stats.users.total)}</div>
            <p className="text-xs text-gray-600 mt-1">
              今月の新規: +{formatNumber(data.stats.users.new_this_month)}
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                プレミアム: {formatNumber(data.stats.users.premium_users)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総授業数</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.stats.courses.total)}</div>
            <p className="text-xs text-gray-600 mt-1">
              今月の新規: +{formatNumber(data.stats.courses.new_this_month)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総レビュー数</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.stats.reviews.total)}</div>
            <p className="text-xs text-gray-600 mt-1">
              今月の新規: +{formatNumber(data.stats.reviews.new_this_month)}
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                平均評価: {data.stats.reviews.average_rating.toFixed(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月間収益</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.stats.revenue.total_this_month)}</div>
            <p className="text-xs text-gray-600 mt-1">
              アクティブサブスク: {formatNumber(data.stats.revenue.subscription_count)}
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                解約率: {data.stats.revenue.churn_rate.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => window.location.href = '/admin/analytics'}>
            詳細分析
          </TabsTrigger>
          <TabsTrigger value="activities">活動ログ</TabsTrigger>
          <TabsTrigger value="health">システム状況</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 人気授業 */}
          <Card>
            <CardHeader>
              <CardTitle>人気授業TOP5</CardTitle>
              <CardDescription>レビュー数が多い授業</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.stats.courses.most_reviewed.map((course, index) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-gray-600">
                          {course.review_count}件のレビュー • 平均評価 {course.average_rating.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 月間収益グラフ */}
          <Card>
            <CardHeader>
              <CardTitle>月間収益推移</CardTitle>
              <CardDescription>過去6ヶ月の収益とサブスクリプション数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.stats.revenue.by_month.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{month.month}</h4>
                      <p className="text-sm text-gray-600">
                        {month.subscriptions}件のサブスクリプション
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(month.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* レビュー分析 */}
          <Card>
            <CardHeader>
              <CardTitle>レビュー分析</CardTitle>
              <CardDescription>月別レビュー数と平均評価</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.stats.reviews.by_month.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{month.month}</h4>
                      <p className="text-sm text-gray-600">
                        {month.count}件のレビュー
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">平均評価: {month.average_rating.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          {/* 最近のアクション */}
          <Card>
            <CardHeader>
              <CardTitle>最近のアクション</CardTitle>
              <CardDescription>管理者の活動履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent_actions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{action.admin_email}</span>
                        <Badge variant="outline" className="text-xs">
                          {action.target_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{action.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(action.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          {/* システム状況 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  データベース
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>状態</span>
                    <div className="flex items-center gap-2">
                      {getHealthStatus(data.system_health.database.status)}
                      <span className="capitalize">{data.system_health.database.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>応答時間</span>
                    <span>{data.system_health.database.response_time}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>接続数</span>
                    <span>{data.system_health.database.connections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Stripe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>状態</span>
                    <div className="flex items-center gap-2">
                      {getHealthStatus(data.system_health.stripe.status)}
                      <span className="capitalize">{data.system_health.stripe.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Webhook</span>
                    <span className="capitalize">{data.system_health.stripe.webhook_status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>最終受信</span>
                    <span className="text-sm">
                      {new Date(data.system_health.stripe.last_webhook).toLocaleString('ja-JP')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  パフォーマンス
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>平均応答時間</span>
                    <span>{data.system_health.performance.avg_response_time}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>エラー率</span>
                    <span>{data.system_health.performance.error_rate.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>稼働率</span>
                    <span>{data.system_health.performance.uptime_percentage.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  ストレージ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>状態</span>
                    <div className="flex items-center gap-2">
                      {getHealthStatus(data.system_health.storage.status)}
                      <span className="capitalize">{data.system_health.storage.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>使用率</span>
                    <span>{data.system_health.storage.usage_percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>空き容量</span>
                    <span>{data.system_health.storage.available_space}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}