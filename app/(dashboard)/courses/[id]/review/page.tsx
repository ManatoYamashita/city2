import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ReviewForm } from '@/components/review/ReviewForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

async function getCourse(courseId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/courses/${courseId}`, {
      cache: 'no-store' // レビューページでは最新の情報を取得
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return null
  }
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { id } = await params
  const course = await getCourse(id)
  
  if (!course) {
    return {
      title: '授業が見つかりません',
    }
  }

  return {
    title: `${course.name} のレビューを書く`,
    description: `${course.name} (${course.instructor}) のレビューを投稿して、後輩学生をサポートしましょう`,
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params

  // IDの基本的なバリデーション
  if (!id || typeof id !== 'string') {
    notFound()
  }

  const course = await getCourse(id)

  if (!course) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* 授業情報の簡潔な表示 */}
      <Card>
        <CardHeader>
          <CardTitle>{course.name}</CardTitle>
          <CardDescription>
            {course.course_code} • {course.instructor} • {course.credits}単位
            {course.department && ` • ${course.department}`}
          </CardDescription>
        </CardHeader>
        {course.description && (
          <CardContent>
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
              {course.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* レビューフォーム */}
      <ReviewForm course={course} />

      {/* 注意事項 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 text-lg">レビュー投稿時の注意</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>1つの授業につき1回のみレビューを投稿できます</li>
            <li>投稿後24時間以内であれば編集が可能です</li>
            <li>個人を特定できる情報や誹謗中傷は控えてください</li>
            <li>後輩学生の履修選択に役立つ具体的な情報を心がけてください</li>
            <li>不適切な内容と判断された場合、レビューが削除される場合があります</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}