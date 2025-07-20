import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'ダッシュボード',
  description: 'City2ダッシュボード - あなたの学習をサポート',
}

// TODO: 実際のデータを取得する関数
async function getDashboardData() {
  // これは仮のデータです。実際にはAPIから取得します
  return {
    totalCourses: 1247,
    totalReviews: 3892,
    averageRating: 4.1,
    userReviewCount: 5,
    recentCourses: [
      {
        id: '1',
        name: 'コンピュータサイエンス入門',
        instructor: '田中太郎',
        rating: 4.2,
        reviewCount: 89,
      },
      {
        id: '2',
        name: '微分積分学II',
        instructor: '佐藤花子',
        rating: 3.8,
        reviewCount: 67,
      },
      {
        id: '3',
        name: '学術英語',
        instructor: 'John Smith',
        rating: 4.5,
        reviewCount: 134,
      },
    ],
    popularCourses: [
      {
        id: '1',
        name: 'コンピュータサイエンス入門',
        instructor: '田中太郎',
        rating: 4.2,
        reviewCount: 89,
      },
      {
        id: '3',
        name: '学術英語',
        instructor: 'John Smith',
        rating: 4.5,
        reviewCount: 134,
      },
      {
        id: '4',
        name: 'ミクロ経済学',
        instructor: '鈴木一郎',
        rating: 4.0,
        reviewCount: 78,
      },
    ],
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
  icon: any
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