'use client'

import { useState, useEffect } from 'react'
import { ReviewCard } from './ReviewCard'
import { ReviewListResponse, ReviewSearchParams, ReviewSortOption } from '@/types/review'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewListProps {
  courseId?: string
  userId?: string
  searchParams?: ReviewSearchParams
  showCourse?: boolean
  className?: string
}

async function fetchReviews(params: ReviewSearchParams): Promise<ReviewListResponse> {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })

  const response = await fetch(`/api/reviews?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch reviews')
  }
  
  return response.json()
}

async function handleVote(reviewId: string, isHelpful: boolean) {
  const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      is_helpful: isHelpful,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to vote')
  }

  return response.json()
}

export function ReviewList({ 
  courseId, 
  userId, 
  searchParams = {}, 
  showCourse = false,
  className 
}: ReviewListProps) {
  const [data, setData] = useState<ReviewListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('-created_at')

  const currentParams: ReviewSearchParams = {
    page: 1,
    limit: 10,
    sort: sortBy as ReviewSortOption,
    course_id: courseId,
    user_id: userId,
    ...searchParams,
  }

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchReviews(currentParams)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'レビューの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [
    courseId,
    userId,
    sortBy,
    currentParams.page,
    currentParams.limit,
  ])

  const handlePageChange = async (newPage: number) => {
    if (!data || newPage < 1) return
    
    try {
      setLoading(true)
      const result = await fetchReviews({
        ...currentParams,
        page: newPage,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ページの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleVoteOnReview = async (reviewId: string, isHelpful: boolean) => {
    try {
      await handleVote(reviewId, isHelpful)
      
      // レビューリストを再読み込み
      const result = await fetchReviews(currentParams)
      setData(result)
    } catch (err) {
      console.error('Vote failed:', err)
      throw err
    }
  }

  const handleEdit = (reviewId: string) => {
    // TODO: レビュー編集機能の実装
    console.log('Edit review:', reviewId)
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('本当にこのレビューを削除しますか？')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('レビューの削除に失敗しました')
      }

      // レビューリストを再読み込み
      const result = await fetchReviews(currentParams)
      setData(result)
    } catch (err) {
      console.error('Delete failed:', err)
      alert(err instanceof Error ? err.message : 'レビューの削除に失敗しました')
    }
  }

  if (loading && !data) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>レビューを読み込んでいます...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-red-600 mb-4">{error}</div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          再試行
        </Button>
      </div>
    )
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-gray-600 mb-4">
          まだレビューが投稿されていません
        </div>
        <p className="text-sm text-gray-500">
          最初のレビューを投稿してみませんか？
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div className={cn('space-y-6', className)}>
      {/* ヘッダーとソート */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {data.total}件のレビュー
          {loading && (
            <span className="ml-2 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              更新中
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">並び順:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_at">新しい順</SelectItem>
              <SelectItem value="created_at">古い順</SelectItem>
              <SelectItem value="-helpful_count">参考になった順</SelectItem>
              <SelectItem value="-overall_rating">評価が高い順</SelectItem>
              <SelectItem value="overall_rating">評価が低い順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* レビュー一覧 */}
      <div className="space-y-4">
        {data.reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onVote={handleVoteOnReview}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showCourse={showCourse}
          />
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data.page - 1)}
            disabled={!data.has_prev || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (data.page <= 3) {
                pageNum = i + 1
              } else if (data.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = data.page - 2 + i
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === data.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(data.page + 1)}
            disabled={!data.has_next || loading}
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}