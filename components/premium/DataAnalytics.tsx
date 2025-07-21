'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Star, 
  BookOpen, 
  Award,
  Download,
  Calendar,
  Target,
  Zap
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalCourses: number
    totalReviews: number
    averageRating: number
    popularDepartments: string[]
  }
  trends: {
    monthlyReviews: { month: string; count: number }[]
    ratingDistribution: { rating: number; count: number }[]
    departmentStats: { department: string; courses: number; avgRating: number }[]
  }
  recommendations: {
    topCourses: Array<{
      id: string
      title: string
      instructor: string
      rating: number
      reviewCount: number
      department: string
    }>
    risingCourses: Array<{
      id: string
      title: string
      instructor: string
      rating: number
      trendScore: number
    }>
  }
  userStats: {
    reviewsWritten: number
    coursesRated: number
    averageGivenRating: number
    favoriteTopics: string[]
  }
}

interface DataAnalyticsProps {
  isPremium: boolean
  className?: string
}

export function DataAnalytics({ isPremium, className }: DataAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6months')
  const [department, setDepartment] = useState('all')

  useEffect(() => {
    if (isPremium) {
      fetchAnalyticsData()
    } else {
      setLoading(false)
    }
  }, [isPremium, timeRange, department])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      // 実際のAPIエンドポイントからデータを取得
      const response = await fetch(`/api/analytics?timeRange=${timeRange}&department=${department}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        // モックデータを表示
        setAnalyticsData(generateMockData())
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
      // モックデータを表示
      setAnalyticsData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): AnalyticsData => ({
    overview: {
      totalCourses: 1247,
      totalReviews: 5683,
      averageRating: 3.8,
      popularDepartments: ['情報科学科', '経済学科', '電気電子工学科'],
    },
    trends: {
      monthlyReviews: [
        { month: '1月', count: 520 },
        { month: '2月', count: 680 },
        { month: '3月', count: 450 },
        { month: '4月', count: 820 },
        { month: '5月', count: 750 },
        { month: '6月', count: 690 },
      ],
      ratingDistribution: [
        { rating: 1, count: 125 },
        { rating: 2, count: 340 },
        { rating: 3, count: 1420 },
        { rating: 4, count: 2150 },
        { rating: 5, count: 1648 },
      ],
      departmentStats: [
        { department: '情報科学科', courses: 89, avgRating: 4.2 },
        { department: '経済学科', courses: 76, avgRating: 3.9 },
        { department: '電気電子工学科', courses: 65, avgRating: 3.7 },
        { department: '機械工学科', courses: 58, avgRating: 3.6 },
        { department: '法学科', courses: 52, avgRating: 4.0 },
      ],
    },
    recommendations: {
      topCourses: [
        {
          id: '1',
          title: 'プログラミング基礎',
          instructor: '田中 太郎',
          rating: 4.8,
          reviewCount: 156,
          department: '情報科学科',
        },
        {
          id: '2',
          title: 'マクロ経済学',
          instructor: '佐藤 花子',
          rating: 4.6,
          reviewCount: 142,
          department: '経済学科',
        },
        {
          id: '3',
          title: '統計学入門',
          instructor: '山田 一郎',
          rating: 4.5,
          reviewCount: 128,
          department: '理学科',
        },
      ],
      risingCourses: [
        {
          id: '4',
          title: 'AI・機械学習概論',
          instructor: '鈴木 美咲',
          rating: 4.4,
          trendScore: 8.9,
        },
        {
          id: '5',
          title: 'ブロックチェーン技術',
          instructor: '高橋 健太',
          rating: 4.3,
          trendScore: 8.5,
        },
      ],
    },
    userStats: {
      reviewsWritten: 23,
      coursesRated: 31,
      averageGivenRating: 3.9,
      favoriteTopics: ['プログラミング', '統計', '経済学'],
    },
  })

  const exportData = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&timeRange=${timeRange}&department=${department}`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics_report.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('エクスポートに失敗しました')
    }
  }

  if (!isPremium) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">プレミアム機能です</h3>
              <p className="text-gray-600 mt-2">
                詳細な統計・分析機能をご利用いただくには、プレミアムプランにアップグレードしてください。
              </p>
            </div>
            <Button onClick={() => window.location.href = '/premium'}>
              プレミアムプランを見る
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            データ分析ダッシュボード
          </CardTitle>
          <CardDescription>
            授業とレビューの詳細分析データ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">期間</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">過去1ヶ月</SelectItem>
                  <SelectItem value="3months">過去3ヶ月</SelectItem>
                  <SelectItem value="6months">過去6ヶ月</SelectItem>
                  <SelectItem value="1year">過去1年</SelectItem>
                  <SelectItem value="all">全期間</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="text-sm font-medium mb-2 block">学科</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての学科</SelectItem>
                  <SelectItem value="cs">情報科学科</SelectItem>
                  <SelectItem value="econ">経済学科</SelectItem>
                  <SelectItem value="ee">電気電子工学科</SelectItem>
                  <SelectItem value="me">機械工学科</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportData('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => exportData('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総授業数</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.totalCourses.toLocaleString()}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総レビュー数</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.totalReviews.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均評価</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.averageRating}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">人気学科数</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.popularDepartments.length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 人気授業・急上昇授業 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              人気授業TOP3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.recommendations.topCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{course.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {course.instructor} • {course.department}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{course.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({course.reviewCount}件のレビュー)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              急上昇授業
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.recommendations.risingCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">上昇中</Badge>
                      <span className="font-medium">{course.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {course.instructor}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          {course.trendScore}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ユーザー統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            あなたの統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData?.userStats.reviewsWritten}
              </p>
              <p className="text-sm text-gray-600">レビュー投稿数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {analyticsData?.userStats.coursesRated}
              </p>
              <p className="text-sm text-gray-600">評価した授業数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {analyticsData?.userStats.averageGivenRating}
              </p>
              <p className="text-sm text-gray-600">平均評価</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData?.userStats.favoriteTopics.length}
              </p>
              <p className="text-sm text-gray-600">お気に入りトピック</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">お気に入りトピック：</p>
            <div className="flex flex-wrap gap-2">
              {analyticsData?.userStats.favoriteTopics.map(topic => (
                <Badge key={topic} variant="secondary">{topic}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}