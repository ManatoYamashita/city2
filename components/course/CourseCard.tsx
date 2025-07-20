'use client'

import Link from 'next/link'
import { Star, Users, BookOpen, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Course } from '@/types/course'
import { cn } from '@/lib/utils'

interface CourseCardProps {
  course: Course
  className?: string
}

function RatingStars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
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
      <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  )
}

function DifficultyIndicator({ difficulty }: { difficulty: number }) {
  const getColor = (level: number) => {
    if (level <= 2) return 'bg-green-500'
    if (level <= 3) return 'bg-yellow-500'
    if (level <= 4) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'w-2 h-4 rounded-sm',
              level <= difficulty ? getColor(difficulty) : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <span className="ml-1 text-sm text-gray-600">
        {difficulty === 1 && '易しい'}
        {difficulty === 2 && 'やや易しい'}
        {difficulty === 3 && '普通'}
        {difficulty === 4 && 'やや難しい'}
        {difficulty === 5 && '難しい'}
      </span>
    </div>
  )
}

export function CourseCard({ course, className }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className={cn(
        'h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer',
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold leading-tight mb-1 truncate">
                {course.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {course.course_code} • {course.instructor}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {course.credits}単位
            </Badge>
          </div>

          {course.department && (
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-xs">
                {course.faculty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {course.department}
              </Badge>
              {course.category && (
                <Badge 
                  variant={course.category === '必修' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {course.category}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 評価と統計 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">総合評価</div>
                {course.total_reviews > 0 ? (
                  <RatingStars rating={course.average_rating} />
                ) : (
                  <span className="text-sm text-gray-400">評価なし</span>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">難易度</div>
                {course.total_reviews > 0 ? (
                  <DifficultyIndicator difficulty={course.average_difficulty} />
                ) : (
                  <span className="text-sm text-gray-400">評価なし</span>
                )}
              </div>
            </div>

            {/* メタ情報 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{course.total_reviews} レビュー</span>
              </div>
              {course.semester && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{course.semester}</span>
                </div>
              )}
            </div>

            {/* 授業概要（短縮版） */}
            {course.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {course.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}