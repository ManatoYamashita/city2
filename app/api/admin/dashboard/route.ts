import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { AdminDashboardStats, AdminActionLog, SystemHealth } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const adminUser = await requireAdminAuth('moderator')
    const supabase = await createClient()

    // 統計データを並行取得
    const [
      usersResult,
      coursesResult,
      reviewsResult,
      revenueResult,
      actionsResult
    ] = await Promise.all([
      fetchUserStats(supabase),
      fetchCourseStats(supabase),
      fetchReviewStats(supabase),
      fetchRevenueStats(supabase),
      fetchRecentActions(supabase)
    ])

    const stats: AdminDashboardStats = {
      users: usersResult,
      courses: coursesResult,
      reviews: reviewsResult,
      revenue: revenueResult,
    }

    const systemHealth = await fetchSystemHealth()

    return NextResponse.json({
      stats,
      recent_actions: actionsResult,
      system_health: systemHealth,
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: '管理者ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}

async function fetchUserStats(supabase: any) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    { count: totalUsers },
    { count: newThisMonth },
    { count: premiumUsers },
    { count: activeLast30Days }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString())
  ])

  return {
    total: totalUsers || 0,
    new_this_month: newThisMonth || 0,
    premium_users: premiumUsers || 0,
    active_last_30_days: activeLast30Days || 0,
  }
}

async function fetchCourseStats(supabase: any) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { count: totalCourses },
    { count: newThisMonth },
    { data: mostReviewed }
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('courses')
      .select(`
        id,
        title,
        instructor,
        reviews:reviews(count)
      `)
      .order('reviews.count', { ascending: false })
      .limit(5)
  ])

  // 最も評価の多い授業の詳細を取得
  const mostReviewedWithStats = await Promise.all(
    (mostReviewed || []).map(async (course: any) => {
      const { data: reviewStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('course_id', course.id)

      const reviewCount = reviewStats?.length || 0
      const averageRating = reviewCount > 0 
        ? reviewStats.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount 
        : 0

      return {
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        review_count: reviewCount,
        average_rating: averageRating,
      }
    })
  )

  return {
    total: totalCourses || 0,
    new_this_month: newThisMonth || 0,
    most_reviewed: mostReviewedWithStats.slice(0, 5),
  }
}

async function fetchReviewStats(supabase: any) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { count: totalReviews },
    { count: newThisMonth },
    { data: allReviews }
  ] = await Promise.all([
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('reviews').select('rating, created_at')
  ])

  const averageRating = allReviews && allReviews.length > 0
    ? allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length
    : 0

  // 過去6ヶ月の月別統計
  const monthlyStats = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    
    const monthReviews = allReviews?.filter((r: any) => {
      const reviewDate = new Date(r.created_at)
      return reviewDate >= date && reviewDate < nextDate
    }) || []

    const monthAverage = monthReviews.length > 0
      ? monthReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / monthReviews.length
      : 0

    monthlyStats.push({
      month: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
      count: monthReviews.length,
      average_rating: monthAverage,
    })
  }

  return {
    total: totalReviews || 0,
    new_this_month: newThisMonth || 0,
    average_rating: averageRating,
    by_month: monthlyStats,
  }
}

async function fetchRevenueStats(supabase: any) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { data: thisMonthBilling },
    { data: allTimeBilling },
    { count: subscriptionCount }
  ] = await Promise.all([
    supabase.from('billing_history')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', startOfMonth.toISOString()),
    supabase.from('billing_history')
      .select('amount')
      .eq('status', 'paid'),
    supabase.from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing'])
  ])

  const totalThisMonth = thisMonthBilling?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0
  const totalAllTime = allTimeBilling?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0

  // 過去6ヶ月の収益統計
  const monthlyRevenue = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    
    const { data: monthBilling } = await supabase
      .from('billing_history')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString())

    const { count: monthSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString())

    const monthRevenue = monthBilling?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0

    monthlyRevenue.push({
      month: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
      revenue: monthRevenue,
      subscriptions: monthSubscriptions || 0,
    })
  }

  // 簡単な解約率計算（実際のプロダクションではより詳細な計算が必要）
  const churnRate = 5.2 // モックデータ

  return {
    total_this_month: totalThisMonth,
    total_all_time: totalAllTime,
    subscription_count: subscriptionCount || 0,
    churn_rate: churnRate,
    by_month: monthlyRevenue,
  }
}

async function fetchRecentActions(supabase: any): Promise<AdminActionLog[]> {
  const { data } = await supabase
    .from('admin_action_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return data || []
}

async function fetchSystemHealth(): Promise<SystemHealth> {
  // 実際のプロダクションでは各サービスの健康状態を確認
  // ここではモックデータを返す
  return {
    database: {
      status: 'healthy',
      response_time: 45,
      connections: 12,
    },
    stripe: {
      status: 'healthy',
      webhook_status: 'operational',
      last_webhook: new Date(Date.now() - 300000).toISOString(), // 5分前
    },
    storage: {
      status: 'healthy',
      usage_percentage: 23,
      available_space: '45.2 GB',
    },
    performance: {
      avg_response_time: 120,
      error_rate: 0.05,
      uptime_percentage: 99.98,
    },
  }
}