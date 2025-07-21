import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseDetail } from '@/components/course/CourseDetail'

interface CoursePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { id } = await params
  
  // TODO: 実際のコース情報を取得してメタデータを生成
  return {
    title: '授業詳細',
    description: '授業の詳細情報とレビューを確認できます',
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params

  // IDの基本的なバリデーション
  if (!id || typeof id !== 'string') {
    notFound()
  }

  return (
    <div>
      <CourseDetail courseId={id} />
    </div>
  )
}