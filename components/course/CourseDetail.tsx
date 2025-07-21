'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Users, BookOpen, ExternalLink, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Course } from '@/types/course'
import { ReviewList } from '@/components/review/ReviewList'
import { cn } from '@/lib/utils'

interface CourseDetailProps {
  courseId: string
  className?: string
}

function RatingStars({ rating, size = 20, showLabel = true }: { 
  rating: number; 
  size?: number;
  showLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={cn(
              'transition-colors',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-lg font-semibold text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DifficultyBar({ difficulty }: { difficulty: number }) {
  const getColor = (level: number) => {
    if (level <= 2) return 'bg-green-500'
    if (level <= 3) return 'bg-yellow-500'
    if (level <= 4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getLabel = (level: number) => {
    if (level <= 1.5) return '非常に易しい'
    if (level <= 2.5) return '易しい'
    if (level <= 3.5) return '普通'
    if (level <= 4.5) return '難しい'
    return '非常に難しい'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>難易度</span>
        <span className="font-medium">{getLabel(difficulty)}</span>
      </div>
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', getColor(difficulty))}
            style={{ width: `${(difficulty / 5) * 100}%` }}
          />
        </div>
        <span className="absolute right-0 top-3 text-xs text-gray-500">
          {difficulty.toFixed(1)} / 5.0
        </span>
      </div>
    </div>
  )
}

async function fetchCourse(courseId: string): Promise<Course> {
  const response = await fetch(`/api/courses/${courseId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch course')
  }
  
  return response.json()
}

export function CourseDetail({ courseId, className }: CourseDetailProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchCourse(courseId)
        setCourse(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '授業情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [courseId])

  if (loading) {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-red-600 mb-4">{error || '授業が見つかりません'}</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          再試行
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* ヘッダー情報 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <span className="font-medium">{course.course_code}</span>
              <span>•</span>
              <span>{course.instructor}</span>
              <span>•</span>
              <span>{course.credits}単位</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.faculty && (
                <Badge variant="outline">{course.faculty}</Badge>
              )}
              {course.department && (
                <Badge variant="outline">{course.department}</Badge>
              )}
              {course.category && (
                <Badge variant={course.category === '必修' ? 'default' : 'secondary'}>
                  {course.category}
                </Badge>
              )}
              {course.semester && (
                <Badge variant="outline">{course.semester}</Badge>
              )}
              {course.year && (
                <Badge variant="outline">{course.year}年度</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <Link href={`/courses/${course.id}/review`}>
              <Button>レビューを書く</Button>
            </Link>
          </div>
        </div>

        {course.university && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>{course.university.name}</span>
            {course.university.location && (
              <>
                <span>•</span>
                <span>{course.university.location}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="レビュー数"
          value={course.total_reviews}
          icon={Users}
          description="投稿されたレビューの数"
        />
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">総合評価</p>
                {course.total_reviews > 0 ? (
                  <RatingStars 
                    rating={course.average_rating} 
                    size={16} 
                    showLabel={false}
                  />
                ) : (
                  <p className="text-sm text-gray-500">評価なし</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <DifficultyBar difficulty={course.average_difficulty} />
          </CardContent>
        </Card>
        <StatCard
          title="課題量"
          value={course.total_reviews > 0 ? `${course.average_workload.toFixed(1)}/5.0` : '評価なし'}
          icon={BookOpen}
          description="課題の多さ"
        />
      </div>

      {/* 授業概要 */}
      {course.description && (
        <Card>
          <CardHeader>
            <CardTitle>授業概要</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {course.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* シラバスリンク */}
      {course.syllabus_url && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">シラバス</h3>
                <p className="text-sm text-gray-600">
                  公式シラバスで詳細な授業内容を確認できます
                </p>
              </div>
              <Button variant="outline" asChild>
                <a 
                  href={course.syllabus_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  シラバスを見る
                  <ExternalLink size={16} />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* レビュー一覧 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          レビュー ({course.total_reviews})
        </h2>
        <ReviewList courseId={course.id} />
      </div>
    </div>
  )
}