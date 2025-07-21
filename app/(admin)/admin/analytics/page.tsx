'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Award,
  Clock
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    total_users: number
    total_revenue: number
    total_reviews: number
    avg_rating: number
    growth_metrics: {
      user_growth: number
      revenue_growth: number
      review_growth: number
    }
  }
  user_analytics: {
    registration_trend: Array<{ date: string; count: number }>
    activity_trend: Array<{ date: string; active_users: number }>
    user_status_breakdown: Array<{ status: string; count: number }>
    premium_conversion: {
      total_free_users: number
      total_premium_users: number
      conversion_rate: number
    }
  }
  revenue_analytics: {
    revenue_trend: Array<{ date: string; amount: number }>
    plan_distribution: Array<{ plan: string; count: number; revenue: number }>
    churn_rate: number
    mrr: number
    arpu: number
  }
  content_analytics: {
    review_trend: Array<{ date: string; count: number }>
    rating_distribution: Array<{ rating: number; count: number }>
    top_courses: Array<{ course_name: string; review_count: number; avg_rating: number }>
    review_engagement: {
      total_reviews: number
      helpful_votes: number
      engagement_rate: number
    }
  }
}

interface TrendIndicatorProps {
  value: number
  label: string
}

function TrendIndicator({ value, label }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNeutral = value === 0
  
  const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown
  const colorClass = isNeutral 
    ? 'text-gray-500' 
    : isPositive 
      ? 'text-green-500' 
      : 'text-red-500'

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">
        {isNeutral ? '0%' : `${Math.abs(value)}%`}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('分析データの取得に失敗しました')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">
            エラー: {error || 'データの読み込みに失敗しました'}
          </div>
          <Button onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            再試行
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            統計分析
          </h1>
          <p className="text-gray-600 mt-2">
            サービス全体の詳細な分析とインサイト
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">過去7日</SelectItem>
              <SelectItem value="30d">過去30日</SelectItem>
              <SelectItem value="90d">過去90日</SelectItem>
              <SelectItem value="1y">過去1年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            レポート出力
          </Button>
        </div>
      </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.total_users.toLocaleString()}</div>
            <TrendIndicator 
              value={data.overview.growth_metrics.user_growth} 
              label="前月比" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総収益</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.total_revenue)}</div>
            <TrendIndicator 
              value={data.overview.growth_metrics.revenue_growth} 
              label="前月比" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総レビュー数</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.total_reviews.toLocaleString()}</div>
            <TrendIndicator 
              value={data.overview.growth_metrics.review_growth} 
              label="前月比" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均評価</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avg_rating.toFixed(1)}</div>
            <div className="text-xs text-gray-600 mt-1">
              5.0点満点中
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 詳細分析タブ */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">ユーザー分析</TabsTrigger>
          <TabsTrigger value="revenue">収益分析</TabsTrigger>
          <TabsTrigger value="content">コンテンツ分析</TabsTrigger>
          <TabsTrigger value="performance">パフォーマンス</TabsTrigger>
        </TabsList>

        {/* ユーザー分析 */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  新規登録推移
                </CardTitle>
                <CardDescription>期間内の新規ユーザー登録数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.user_analytics.registration_trend.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.count / Math.max(...data.user_analytics.registration_trend.map(d => d.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  プレミアム転換率
                </CardTitle>
                <CardDescription>フリーユーザーからプレミアムへの転換</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">フリーユーザー</span>
                    <span className="font-medium">{data.user_analytics.premium_conversion.total_free_users.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">プレミアムユーザー</span>
                    <span className="font-medium">{data.user_analytics.premium_conversion.total_premium_users.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">転換率</span>
                      <span className="text-lg font-bold text-green-500">
                        {formatPercentage(data.user_analytics.premium_conversion.conversion_rate)}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${data.user_analytics.premium_conversion.conversion_rate * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                ユーザーステータス分布
              </CardTitle>
              <CardDescription>現在のユーザー状態の内訳</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.user_analytics.user_status_breakdown.map((status, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold mb-2">{status.count.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 capitalize">{status.status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 収益分析 */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  月次継続収益 (MRR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.revenue_analytics.mrr)}</div>
                <p className="text-xs text-gray-600 mt-1">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ユーザー平均収益 (ARPU)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.revenue_analytics.arpu)}</div>
                <p className="text-xs text-gray-600 mt-1">Average Revenue Per User</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  チャーン率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.revenue_analytics.churn_rate)}</div>
                <p className="text-xs text-gray-600 mt-1">月次解約率</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  収益推移
                </CardTitle>
                <CardDescription>期間内の収益の変化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenue_analytics.revenue_trend.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.amount / Math.max(...data.revenue_analytics.revenue_trend.map(d => d.amount))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  プラン別収益分布
                </CardTitle>
                <CardDescription>各プランからの収益貢献</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.revenue_analytics.plan_distribution.map((plan, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{plan.plan}</span>
                        <span className="text-sm">{formatCurrency(plan.revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>{plan.count}ユーザー</span>
                        <span>{((plan.revenue / data.overview.total_revenue) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(plan.revenue / data.overview.total_revenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* コンテンツ分析 */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  レビュー投稿推移
                </CardTitle>
                <CardDescription>期間内のレビュー投稿数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.content_analytics.review_trend.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.count / Math.max(...data.content_analytics.review_trend.map(d => d.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  評価分布
                </CardTitle>
                <CardDescription>星評価の分布状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.content_analytics.rating_distribution.map((rating, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm w-8">{rating.rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${(rating.count / Math.max(...data.content_analytics.rating_distribution.map(r => r.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{rating.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                人気授業トップ
              </CardTitle>
              <CardDescription>レビュー数と評価の高い授業</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.content_analytics.top_courses.slice(0, 5).map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{course.course_name}</div>
                      <div className="text-sm text-gray-600">
                        {course.review_count}件のレビュー
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{course.avg_rating.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">平均評価</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* パフォーマンス */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  エンゲージメント指標
                </CardTitle>
                <CardDescription>ユーザーのアクティビティ分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">総レビュー数</span>
                    <span className="font-medium">{data.content_analytics.review_engagement.total_reviews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ヘルプフル投票数</span>
                    <span className="font-medium">{data.content_analytics.review_engagement.helpful_votes.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">エンゲージメント率</span>
                      <span className="text-lg font-bold text-blue-500">
                        {formatPercentage(data.content_analytics.review_engagement.engagement_rate)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  アクティブユーザー推移
                </CardTitle>
                <CardDescription>期間内のアクティブユーザー数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.user_analytics.activity_trend.slice(-7).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.active_users / Math.max(...data.user_analytics.activity_trend.map(d => d.active_users))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12">{item.active_users}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                システムパフォーマンス概要
              </CardTitle>
              <CardDescription>主要指標のサマリー</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-blue-500">
                    {formatPercentage(data.user_analytics.premium_conversion.conversion_rate)}
                  </div>
                  <div className="text-xs text-gray-600">転換率</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-red-500">
                    {formatPercentage(data.revenue_analytics.churn_rate)}
                  </div>
                  <div className="text-xs text-gray-600">チャーン率</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-yellow-500">
                    {data.overview.avg_rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600">平均評価</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-green-500">
                    {formatPercentage(data.content_analytics.review_engagement.engagement_rate)}
                  </div>
                  <div className="text-xs text-gray-600">エンゲージメント</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}