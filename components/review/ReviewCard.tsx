'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ThumbsUp, ThumbsDown, Flag, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RatingDisplay } from './RatingStars'
import { Review } from '@/types/review'
import { ASSIGNMENT_FREQUENCY_LABELS, GRADING_CRITERIA_LABELS } from '@/lib/validations/review'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface ReviewCardProps {
  review: Review
  onVote?: (reviewId: string, isHelpful: boolean) => void
  onEdit?: (reviewId: string) => void
  onDelete?: (reviewId: string) => void
  showCourse?: boolean
  className?: string
}

export function ReviewCard({
  review,
  onVote,
  onEdit,
  onDelete,
  showCourse = false,
  className
}: ReviewCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const { user } = useAuth()

  const isOwner = user?.id === review.user_id
  const canEdit = isOwner && !review.is_verified
  const canDelete = isOwner || user?.profile?.is_admin

  const handleVote = async (isHelpful: boolean) => {
    if (!onVote || isVoting || !user) return

    setIsVoting(true)
    try {
      await onVote(review.id, isHelpful)
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ja
      })
    } catch {
      return '不明'
    }
  }

  const getAnonymousInfo = () => {
    const parts = []
    if (review.anonymous_admission_year) {
      const currentYear = new Date().getFullYear()
      const yearsSinceAdmission = currentYear - review.anonymous_admission_year + 1
      parts.push(`${yearsSinceAdmission}年生（${review.anonymous_admission_year}年入学）`)
    }
    if (review.anonymous_department) {
      parts.push(review.anonymous_department)
    }
    return parts.length > 0 ? parts.join(' / ') : '匿名ユーザー'
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">
                {getAnonymousInfo()}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {formatDate(review.created_at)}
              </span>
              {review.updated_at !== review.created_at && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">編集済み</span>
                </>
              )}
            </div>

            {review.title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {review.title}
              </h3>
            )}

            {showCourse && review.course && (
              <div className="mb-2">
                <Badge variant="outline" className="text-xs">
                  {review.course.name} ({review.course.course_code})
                </Badge>
              </div>
            )}

            {/* 評価 */}
            <div className="flex flex-wrap gap-4 mb-3">
              <RatingDisplay
                rating={review.overall_rating}
                label="総合"
                size="sm"
              />
              <RatingDisplay
                rating={review.difficulty}
                label="難易度"
                size="sm"
              />
              <RatingDisplay
                rating={review.workload}
                label="課題量"
                size="sm"
              />
            </div>
          </div>

          {/* アクション */}
          {(canEdit || canDelete) && (
            <div className="flex gap-1">
              {canEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(review.id)}
                >
                  <Edit size={16} />
                </Button>
              )}
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(review.id)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* レビュー内容 */}
        <div className="space-y-4 mb-4">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {review.content}
          </p>

          {/* 良い点・悪い点・アドバイス */}
          {(review.pros || review.cons || review.advice) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {review.pros && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-1">
                    良い点
                  </h4>
                  <p className="text-sm text-green-700">{review.pros}</p>
                </div>
              )}

              {review.cons && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    悪い点
                  </h4>
                  <p className="text-sm text-red-700">{review.cons}</p>
                </div>
              )}

              {review.advice && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    アドバイス
                  </h4>
                  <p className="text-sm text-blue-700">{review.advice}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 詳細情報 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {review.attendance_required !== undefined && (
            <Badge variant="outline" className="text-xs">
              出席: {review.attendance_required ? '必要' : '不要'}
            </Badge>
          )}
          {review.test_difficulty && (
            <Badge variant="outline" className="text-xs">
              テスト難易度: {review.test_difficulty}/5
            </Badge>
          )}
          {review.assignment_frequency && (
            <Badge variant="outline" className="text-xs">
              課題頻度: {ASSIGNMENT_FREQUENCY_LABELS[review.assignment_frequency]}
            </Badge>
          )}
          {review.grading_criteria && (
            <Badge variant="outline" className="text-xs">
              評価: {GRADING_CRITERIA_LABELS[review.grading_criteria]}
            </Badge>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {user && !isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(true)}
                  disabled={isVoting}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp size={16} />
                  <span>参考になった</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(false)}
                  disabled={isVoting}
                  className="flex items-center gap-1"
                >
                  <ThumbsDown size={16} />
                </Button>
              </>
            )}
            <span className="text-sm text-gray-500">
              {review.helpful_count} 人が参考になったと回答
            </span>
          </div>

          {user && !isOwner && (
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Flag size={16} />
              <span className="text-sm">報告</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}