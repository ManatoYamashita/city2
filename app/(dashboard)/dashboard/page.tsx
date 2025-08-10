import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'ダッシュボード',
  description: 'City2ダッシュボード - あなたの学習をサポート',
}

// Supabaseから実データを取得する関数
async function getDashboardData() {
  const supabase = await createClient()

  // 認証済みユーザーの取得（未ログイン時はnull）
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // 並行で集計を取得
  const [
    { count: totalCourses },
    { count: totalReviews },
    averageRatingResult,
    { count: userReviewCount },
    { data: recentCoursesRaw },
    { data: popularCoursesRaw },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    // PostgRESTの集計関数を利用して平均を取得
    supabase.from('courses').select('avg(average_rating)'),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || ''),
    supabase
      .from('courses')
      .select('id,name,instructor,average_rating,total_reviews,created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('courses')
      .select('id,name,instructor,average_rating,total_reviews')
      .order('total_reviews', { ascending: false })
      .limit(3),
  ])

  // 平均評価の抽出（データがない場合は0）
  const avgValue = Array.isArray(averageRatingResult?.data)
    ? (averageRatingResult.data[0] as any)?.avg ?? 0
    : 0
  const averageRating = Number.isFinite(avgValue) ? parseFloat(Number(avgValue).toFixed(1)) : 0

  // 表示用のコースデータに整形
  const mapCourse = (c: any) => ({
    id: c.id as string,
    name: c.name as string,
    instructor: c.instructor as string,
    rating: typeof c.average_rating === 'number' ? parseFloat(c.average_rating.toFixed(1)) : 0,
    reviewCount: (c.total_reviews as number) ?? 0,
  })

  return {
    totalCourses: totalCourses || 0,
    totalReviews: totalReviews || 0,
    averageRating,
    userReviewCount: userId ? userReviewCount || 0 : 0,
    recentCourses: (recentCoursesRaw || []).map(mapCourse),
    popularCourses: (popularCoursesRaw || []).map(mapCourse),
  }
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon 
}: {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function CourseCard({ 
  course 
}: {
  course: {
    id: string
    name: string
    instructor: string
    rating: number
    reviewCount: number
  }
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base line-clamp-1">{course.name}</CardTitle>
        <CardDescription>{course.instructor}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{course.rating}</span>
            <span className="text-xs text-gray-500">({course.reviewCount})</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/courses/${course.id}`}>詳細</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          あなたの学習活動の概要とおすすめ情報をご確認ください
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="登録授業数"
          value={data.totalCourses.toLocaleString()}
          description="データベース内の授業数"
          icon={BookOpen}
        />
        <StatCard
          title="総レビュー数"
          value={data.totalReviews.toLocaleString()}
          description="投稿されたレビューの総数"
          icon={Users}
        />
        <StatCard
          title="平均評価"
          value={data.averageRating}
          description="全授業の平均評価"
          icon={Star}
        />
        <StatCard
          title="あなたのレビュー"
          value={data.userReviewCount}
          description="投稿したレビュー数"
          icon={TrendingUp}
        />
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>
            よく使用される機能に素早くアクセスできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto py-4">
              <Link href="/courses" className="flex flex-col items-center gap-2">
                <BookOpen size={24} />
                <span>授業を検索</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/reviews/new" className="flex flex-col items-center gap-2">
                <Star size={24} />
                <span>レビューを書く</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4">
              <Link href="/premium" className="flex flex-col items-center gap-2">
                <TrendingUp size={24} />
                <span>プレミアム機能</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近追加された授業 */}
        <Card>
          <CardHeader>
            <CardTitle>最近追加された授業</CardTitle>
            <CardDescription>
              新しく登録された授業をチェックしてみましょう
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/courses?sort=-created_at">
                  すべての新着授業を見る
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 人気の授業 */}
        <Card>
          <CardHeader>
            <CardTitle>人気の授業</CardTitle>
            <CardDescription>
              多くの学生にレビューされている授業です
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.popularCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <div className="pt-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/courses?sort=-total_reviews">
                  すべての人気授業を見る
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}