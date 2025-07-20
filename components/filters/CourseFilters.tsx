'use client'

import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CourseSearchParams } from '@/types/course'
import { cn } from '@/lib/utils'

interface CourseFiltersProps {
  filters: CourseSearchParams
  onChange: (filters: CourseSearchParams) => void
  onApply?: () => void
  className?: string
}

interface FilterOption {
  value: string
  label: string
}

// TODO: これらのオプションは実際のデータから動的に取得する
const DEPARTMENT_OPTIONS: FilterOption[] = [
  { value: 'コンピュータサイエンス専攻', label: 'コンピュータサイエンス専攻' },
  { value: '数学専攻', label: '数学専攻' },
  { value: '物理学専攻', label: '物理学専攻' },
  { value: '経済学専攻', label: '経済学専攻' },
  { value: '英語専攻', label: '英語専攻' },
]

const FACULTY_OPTIONS: FilterOption[] = [
  { value: '工学部', label: '工学部' },
  { value: '理学部', label: '理学部' },
  { value: '経済学部', label: '経済学部' },
  { value: '文学部', label: '文学部' },
]

const CATEGORY_OPTIONS: FilterOption[] = [
  { value: '必修', label: '必修' },
  { value: '選択', label: '選択' },
  { value: '自由', label: '自由' },
]

const SEMESTER_OPTIONS: FilterOption[] = [
  { value: '前期', label: '前期' },
  { value: '後期', label: '後期' },
  { value: '通年', label: '通年' },
  { value: '集中', label: '集中' },
]

const CREDITS_OPTIONS: FilterOption[] = [
  { value: '1', label: '1単位' },
  { value: '2', label: '2単位' },
  { value: '3', label: '3単位' },
  { value: '4', label: '4単位' },
  { value: '5', label: '5単位以上' },
]

const SORT_OPTIONS: FilterOption[] = [
  { value: 'name', label: '授業名（昇順）' },
  { value: '-name', label: '授業名（降順）' },
  { value: 'instructor', label: '教員名（昇順）' },
  { value: '-instructor', label: '教員名（降順）' },
  { value: '-average_rating', label: '評価が高い順' },
  { value: 'average_rating', label: '評価が低い順' },
  { value: '-total_reviews', label: 'レビューが多い順' },
  { value: 'average_difficulty', label: '難易度が易しい順' },
  { value: '-average_difficulty', label: '難易度が難しい順' },
  { value: '-created_at', label: '新しい順' },
]

export function CourseFilters({ 
  filters, 
  onChange, 
  onApply,
  className 
}: CourseFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: keyof CourseSearchParams, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onChange(newFilters)
  }

  const handleApply = () => {
    onApply?.()
    setIsOpen(false)
  }

  const handleClear = () => {
    const clearedFilters = {
      search: localFilters.search || '',
      sort: 'name',
    } as CourseSearchParams
    setLocalFilters(clearedFilters)
    onChange(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    const keys: (keyof CourseSearchParams)[] = [
      'department', 'faculty', 'category', 'semester', 'credits', 'min_rating', 'max_difficulty'
    ]
    return keys.filter(key => localFilters[key] !== undefined && localFilters[key] !== '').length
  }

  const getActiveFiltersList = () => {
    const activeFilters: { key: string; label: string; value: string }[] = []
    
    if (localFilters.department) {
      activeFilters.push({
        key: 'department',
        label: '学科',
        value: localFilters.department
      })
    }
    
    if (localFilters.faculty) {
      activeFilters.push({
        key: 'faculty',
        label: '学部',
        value: localFilters.faculty
      })
    }
    
    if (localFilters.category) {
      activeFilters.push({
        key: 'category',
        label: 'カテゴリ',
        value: localFilters.category
      })
    }
    
    if (localFilters.semester) {
      activeFilters.push({
        key: 'semester',
        label: '開講時期',
        value: localFilters.semester
      })
    }
    
    if (localFilters.credits) {
      activeFilters.push({
        key: 'credits',
        label: '単位数',
        value: `${localFilters.credits}単位`
      })
    }
    
    if (localFilters.min_rating) {
      activeFilters.push({
        key: 'min_rating',
        label: '最低評価',
        value: `${localFilters.min_rating}以上`
      })
    }
    
    if (localFilters.max_difficulty) {
      activeFilters.push({
        key: 'max_difficulty',
        label: '最大難易度',
        value: `${localFilters.max_difficulty}以下`
      })
    }

    return activeFilters
  }

  const removeFilter = (key: string) => {
    handleFilterChange(key as keyof CourseSearchParams, undefined)
  }

  const activeFiltersCount = getActiveFiltersCount()
  const activeFiltersList = getActiveFiltersList()

  return (
    <div className={cn('space-y-4', className)}>
      {/* フィルターボタンとアクティブフィルター */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter size={16} />
          フィルター
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* ソート */}
        <Select
          value={localFilters.sort || 'name'}
          onValueChange={(value) => handleFilterChange('sort', value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="並び順を選択" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X size={16} className="mr-1" />
            クリア
          </Button>
        )}
      </div>

      {/* アクティブフィルターのバッジ表示 */}
      {activeFiltersList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFiltersList.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="text-xs text-gray-600">{filter.label}:</span>
              <span>{filter.value}</span>
              <X
                size={12}
                className="cursor-pointer hover:text-red-500"
                onClick={() => removeFilter(filter.key)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* フィルターパネル */}
      {isOpen && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">フィルター設定</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 学部 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  学部
                </label>
                <Select
                  value={localFilters.faculty || ''}
                  onValueChange={(value) => handleFilterChange('faculty', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="学部を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {FACULTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 学科 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  学科・専攻
                </label>
                <Select
                  value={localFilters.department || ''}
                  onValueChange={(value) => handleFilterChange('department', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="学科を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {DEPARTMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* カテゴリ */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  カテゴリ
                </label>
                <Select
                  value={localFilters.category || ''}
                  onValueChange={(value) => handleFilterChange('category', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 開講時期 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  開講時期
                </label>
                <Select
                  value={localFilters.semester || ''}
                  onValueChange={(value) => handleFilterChange('semester', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="開講時期を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {SEMESTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 単位数 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  単位数
                </label>
                <Select
                  value={localFilters.credits ? localFilters.credits.toString() : ''}
                  onValueChange={(value) => handleFilterChange('credits', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="単位数を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {CREDITS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 最低評価 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  最低評価
                </label>
                <Select
                  value={localFilters.min_rating ? localFilters.min_rating.toString() : ''}
                  onValueChange={(value) => handleFilterChange('min_rating', value ? parseFloat(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="最低評価を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">指定なし</SelectItem>
                    <SelectItem value="4">4.0以上</SelectItem>
                    <SelectItem value="3.5">3.5以上</SelectItem>
                    <SelectItem value="3">3.0以上</SelectItem>
                    <SelectItem value="2.5">2.5以上</SelectItem>
                    <SelectItem value="2">2.0以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClear}>
                クリア
              </Button>
              <Button onClick={handleApply}>
                適用
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}