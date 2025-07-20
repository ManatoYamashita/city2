'use client'

import { Suspense } from 'react'
import { Metadata } from 'next'
import { SearchBar } from '@/components/search/SearchBar'
import { CourseFilters } from '@/components/filters/CourseFilters'
import { CourseList } from '@/components/course/CourseList'
import { useCourseSearch } from '@/hooks/useCourseSearch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function CoursesPageContent() {
  const { params, search, updateFilters } = useCourseSearch()

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">授業検索</h1>
        <p className="text-gray-600 mt-2">
          授業名、教員名、科目コードで検索して、あなたにぴったりの授業を見つけましょう
        </p>
      </div>

      {/* 検索バー */}
      <Card>
        <CardContent className="p-6">
          <SearchBar
            value={params.search || ''}
            onChange={(value) => updateFilters({ search: value })}
            onSearch={(value) => search(value)}
            placeholder="授業名、教員名、科目コードで検索..."
          />
        </CardContent>
      </Card>

      {/* フィルターとソート */}
      <CourseFilters
        filters={params}
        onChange={updateFilters}
      />

      {/* 検索結果 */}
      <CourseList searchParams={params} />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>読み込み中...</span>
        </div>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CoursesPageContent />
    </Suspense>
  )
}