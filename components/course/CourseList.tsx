'use client'

import { useState, useEffect } from 'react'
import { CourseCard } from './CourseCard'
import { CourseListResponse, CourseSearchParams } from '@/types/course'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CourseListProps {
  searchParams?: CourseSearchParams
  className?: string
}

async function fetchCourses(params: CourseSearchParams): Promise<CourseListResponse> {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })

  const response = await fetch(`/api/courses?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch courses')
  }
  
  return response.json()
}

export function CourseList({ searchParams = {}, className }: CourseListProps) {
  const [data, setData] = useState<CourseListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentParams: CourseSearchParams = {
    page: 1,
    limit: 20,
    sort: 'name',
    ...searchParams,
  }

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchCourses(currentParams)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '授業の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [
    currentParams.search,
    currentParams.department,
    currentParams.faculty,
    currentParams.instructor,
    currentParams.category,
    currentParams.semester,
    currentParams.year,
    currentParams.credits,
    currentParams.min_rating,
    currentParams.max_difficulty,
    currentParams.sort,
    currentParams.page,
    currentParams.limit,
  ])

  const handlePageChange = async (newPage: number) => {
    if (!data || newPage < 1) return
    
    try {
      setLoading(true)
      const result = await fetchCourses({
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

  if (loading && !data) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>授業を読み込んでいます...</span>
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

  if (!data || data.courses.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-gray-600 mb-4">
          条件に一致する授業が見つかりませんでした
        </div>
        <p className="text-sm text-gray-500">
          検索条件を変更してお試しください
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / data.limit)

  return (
    <div className={cn('space-y-6', className)}>
      {/* 検索結果サマリー */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {data.total}件中 {(data.page - 1) * data.limit + 1}〜
          {Math.min(data.page * data.limit, data.total)}件を表示
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>更新中...</span>
          </div>
        )}
      </div>

      {/* 授業一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.courses.map((course) => (
          <CourseCard key={course.id} course={course} />
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
            {/* ページ番号表示 */}
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