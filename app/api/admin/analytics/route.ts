import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminAuth } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック（admin以上が必要）
    await requireAdminAuth('admin')
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // 期間の計算
    const daysAgo = getDaysFromTimeRange(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    const startDateISO = startDate.toISOString()

    // 前月比較用の開始日
    const prevStartDate = new Date()
    prevStartDate.setDate(prevStartDate.getDate() - (daysAgo * 2))
    const prevStartDateISO = prevStartDate.toISOString()

    // 並行でデータを取得
    const [
      overviewResult,
      userAnalyticsResult,
      revenueAnalyticsResult,
      contentAnalyticsResult
    ] = await Promise.all([
      fetchOverviewData(supabase, startDateISO, prevStartDateISO),
      fetchUserAnalytics(supabase, startDateISO, daysAgo),
      fetchRevenueAnalytics(supabase, startDateISO, daysAgo),
      fetchContentAnalytics(supabase, startDateISO, daysAgo)
    ])

    return NextResponse.json({
      overview: overviewResult,
      user_analytics: userAnalyticsResult,
      revenue_analytics: revenueAnalyticsResult,
      content_analytics: contentAnalyticsResult,
    })

  } catch (error) {
    console.error('Admin analytics API error:', error)
    return NextResponse.json(
      { error: '分析データの取得に失敗しました' },
      { status: 500 }
    )
  }
}

function getDaysFromTimeRange(timeRange: string): number {
  switch (timeRange) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    case '1y': return 365
    default: return 30
  }
}

async function fetchOverviewData(supabase: ReturnType<typeof createClient>, startDate: string, prevStartDate: string) {
  // 現在の期間のデータ
  const [
    { count: totalUsers },
    { data: revenueData },
    { count: totalReviews },
    { data: avgRatingData }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('billing_history')
      .select('amount')
      .eq('status', 'paid'),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('reviews')
      .select('rating')
  ])

  // 前期間のデータ（成長率計算用）
  const [
    { count: prevUsers },
    { data: prevRevenueData },
    { count: prevReviews }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', prevStartDate)
      .lt('created_at', startDate),
    supabase
      .from('billing_history')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', prevStartDate)
      .lt('created_at', startDate),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', prevStartDate)
      .lt('created_at', startDate)
  ])

  const currentUsers = totalUsers || 0
  const prevUsersCount = prevUsers || 0
  const currentRevenue = revenueData?.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) || 0
  const prevRevenue = prevRevenueData?.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) || 0
  const currentReviews = totalReviews || 0
  const prevReviewsCount = prevReviews || 0
  const avgRating = avgRatingData?.length > 0 
    ? avgRatingData.reduce((sum: number, item: { rating: number }) => sum + item.rating, 0) / avgRatingData.length 
    : 0

  return {
    total_users: currentUsers,
    total_revenue: currentRevenue,
    total_reviews: currentReviews,
    avg_rating: avgRating,
    growth_metrics: {
      user_growth: prevUsersCount > 0 ? ((currentUsers - prevUsersCount) / prevUsersCount * 100) : 0,
      revenue_growth: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100) : 0,
      review_growth: prevReviewsCount > 0 ? ((currentReviews - prevReviewsCount) / prevReviewsCount * 100) : 0,
    }
  }
}

async function fetchUserAnalytics(supabase: ReturnType<typeof createClient>, startDate: string, daysAgo: number) {
  // 登録推移データを生成
  const registrationTrend = []
  const activityTrend = []
  
  for (let i = daysAgo; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateISO = date.toISOString().split('T')[0]
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextDateISO = nextDate.toISOString().split('T')[0]

    // 新規登録数
    const { count: registrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateISO)
      .lt('created_at', nextDateISO)

    // アクティブユーザー数（レビュー投稿やログインしたユーザー）
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', dateISO)
      .lt('last_sign_in_at', nextDateISO)

    registrationTrend.push({
      date: dateISO,
      count: registrations || 0
    })

    activityTrend.push({
      date: dateISO,
      active_users: activeUsers || 0
    })
  }

  // ユーザーステータス分布
  const [
    { count: activeUsers },
    { count: suspendedUsers },
    { count: deletedUsers }
  ] = await Promise.all([
    supabase
      .from('user_status')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('user_status')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'suspended'),
    supabase
      .from('user_status')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'deleted')
  ])

  // プレミアム転換データ
  const [
    { count: totalUsers },
    { count: premiumUsers }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing'])
  ])

  const freeUsers = (totalUsers || 0) - (premiumUsers || 0)
  const conversionRate = totalUsers > 0 ? (premiumUsers || 0) / totalUsers : 0

  return {
    registration_trend: registrationTrend,
    activity_trend: activityTrend,
    user_status_breakdown: [
      { status: 'active', count: activeUsers || 0 },
      { status: 'suspended', count: suspendedUsers || 0 },
      { status: 'deleted', count: deletedUsers || 0 }
    ],
    premium_conversion: {
      total_free_users: freeUsers,
      total_premium_users: premiumUsers || 0,
      conversion_rate: conversionRate
    }
  }
}

async function fetchRevenueAnalytics(supabase: ReturnType<typeof createClient>, startDate: string, daysAgo: number) {
  // 収益推移データを生成
  const revenueTrend = []
  
  for (let i = daysAgo; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateISO = date.toISOString().split('T')[0]
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextDateISO = nextDate.toISOString().split('T')[0]

    const { data: dailyRevenue } = await supabase
      .from('billing_history')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', dateISO)
      .lt('created_at', nextDateISO)

    const amount = dailyRevenue?.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0) || 0

    revenueTrend.push({
      date: dateISO,
      amount: amount
    })
  }

  // プラン別分布
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('price_id')
    .in('status', ['active', 'trialing'])

  const planCounts: Record<string, number> = {}
  subscriptions?.forEach((sub: { price_id: string }) => {
    const planName = getPlanName(sub.price_id)
    planCounts[planName] = (planCounts[planName] || 0) + 1
  })

  const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
    revenue: count * getPlanAmount(getPriceIdFromName(plan))
  }))

  // MRR計算（月次継続収益）
  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('price_id')
    .in('status', ['active', 'trialing'])

  const mrr = activeSubscriptions?.reduce((sum: number, sub: { price_id: string }) => {
    const amount = getPlanAmount(sub.price_id)
    // 年額プランは12で割って月額換算
    const monthlyAmount = sub.price_id.includes('yearly') ? amount / 12 : amount
    return sum + monthlyAmount
  }, 0) || 0

  // ARPU（ユーザー平均収益）
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const arpu = totalUsers > 0 ? mrr / totalUsers : 0

  // チャーン率（簡易計算）
  const { count: canceledSubs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('canceled_at', startDate)

  const { count: totalSubs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })

  const churnRate = totalSubs > 0 ? (canceledSubs || 0) / totalSubs : 0

  return {
    revenue_trend: revenueTrend,
    plan_distribution: planDistribution,
    churn_rate: churnRate,
    mrr: mrr,
    arpu: arpu
  }
}

async function fetchContentAnalytics(supabase: ReturnType<typeof createClient>, startDate: string, daysAgo: number) {
  // レビュー推移データを生成
  const reviewTrend = []
  
  for (let i = daysAgo; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateISO = date.toISOString().split('T')[0]
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nextDateISO = nextDate.toISOString().split('T')[0]

    const { count: dailyReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateISO)
      .lt('created_at', nextDateISO)

    reviewTrend.push({
      date: dateISO,
      count: dailyReviews || 0
    })
  }

  // 評価分布
  const ratingDistribution = []
  for (let rating = 1; rating <= 5; rating++) {
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('rating', rating)

    ratingDistribution.push({
      rating,
      count: count || 0
    })
  }

  // トップ授業（レビュー数と評価の高い授業）
  const { data: topCoursesData } = await supabase
    .from('reviews')
    .select(`
      course_id,
      rating,
      courses (name)
    `)

  const courseStats: Record<string, { name: string; ratings: number[]; count: number }> = {}
  
  topCoursesData?.forEach((review: { course_id: string; rating: number; courses?: { name: string } }) => {
    const courseId = review.course_id
    if (!courseStats[courseId]) {
      courseStats[courseId] = {
        name: review.courses?.name || `Course ${courseId}`,
        ratings: [],
        count: 0
      }
    }
    courseStats[courseId].ratings.push(review.rating)
    courseStats[courseId].count++
  })

  const topCourses = Object.entries(courseStats)
    .map(([, stats]) => ({
      course_name: stats.name,
      review_count: stats.count,
      avg_rating: stats.ratings.length > 0 
        ? stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length 
        : 0
    }))
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 10)

  // エンゲージメント指標
  const [
    { count: totalReviews },
    { count: helpfulVotes }
  ] = await Promise.all([
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('review_votes')
      .select('*', { count: 'exact', head: true })
      .eq('vote_type', 'helpful')
  ])

  const engagementRate = totalReviews > 0 ? (helpfulVotes || 0) / totalReviews : 0

  return {
    review_trend: reviewTrend,
    rating_distribution: ratingDistribution,
    top_courses: topCourses,
    review_engagement: {
      total_reviews: totalReviews || 0,
      helpful_votes: helpfulVotes || 0,
      engagement_rate: engagementRate
    }
  }
}

// ヘルパー関数
function getPlanName(priceId: string): string {
  const planNames: Record<string, string> = {
    'price_premium_monthly': 'プレミアム（月額）',
    'price_premium_yearly': 'プレミアム（年額）',
  }
  return planNames[priceId] || 'Unknown Plan'
}

function getPlanAmount(priceId: string): number {
  const planAmounts: Record<string, number> = {
    'price_premium_monthly': 980,
    'price_premium_yearly': 9800,
  }
  return planAmounts[priceId] || 0
}

function getPriceIdFromName(planName: string): string {
  const priceIds: Record<string, string> = {
    'プレミアム（月額）': 'price_premium_monthly',
    'プレミアム（年額）': 'price_premium_yearly',
  }
  return priceIds[planName] || 'price_premium_monthly'
}