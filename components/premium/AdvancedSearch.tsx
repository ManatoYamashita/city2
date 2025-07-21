'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  BookOpen, 
  Clock, 
  TrendingUp,
  Zap 
} from 'lucide-react'

interface AdvancedSearchFilters {
  keyword: string
  department: string
  instructor: string
  difficulty: number[]
  rating: number[]
  credits: number[]
  semester: string
  year: string
  courseType: string[]
  features: string[]
  tags: string[]
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void
  isPremium: boolean
  className?: string
}

const DEPARTMENTS = [
  '情報科学科',
  '電気電子工学科',
  '機械工学科',
  '土木工学科',
  '建築学科',
  '化学生命工学科',
  '経済学科',
  '経営学科',
  '法学科',
  '文学科',
  '理学科',
  '医学科',
]

const COURSE_TYPES = [
  '講義',
  '演習',
  '実験',
  '実習',
  'セミナー',
  '卒業研究',
]

const FEATURES = [
  'オンライン対応',
  '英語で実施',
  'プレゼンテーション重視',
  'グループワーク多め',
  '就職に有利',
  '資格取得可能',
  '留学推奨',
]

export function AdvancedSearch({ onSearch, isPremium, className }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    keyword: '',
    department: '',
    instructor: '',
    difficulty: [1, 5],
    rating: [1, 5],
    credits: [1, 4],
    semester: '',
    year: '',
    courseType: [],
    features: [],
    tags: [],
  })

  const [customTag, setCustomTag] = useState('')

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const addCustomTag = () => {
    if (customTag.trim() && !filters.tags.includes(customTag.trim())) {
      handleFilterChange('tags', [...filters.tags, customTag.trim()])
      setCustomTag('')
    }
  }

  const removeTag = (tag: string) => {
    handleFilterChange('tags', filters.tags.filter(t => t !== tag))
  }

  const handleCourseTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      handleFilterChange('courseType', [...filters.courseType, type])
    } else {
      handleFilterChange('courseType', filters.courseType.filter(t => t !== type))
    }
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      handleFilterChange('features', [...filters.features, feature])
    } else {
      handleFilterChange('features', filters.features.filter(f => f !== feature))
    }
  }

  const clearFilters = () => {
    setFilters({
      keyword: '',
      department: '',
      instructor: '',
      difficulty: [1, 5],
      rating: [1, 5],
      credits: [1, 4],
      semester: '',
      year: '',
      courseType: [],
      features: [],
      tags: [],
    })
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  if (!isPremium) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">プレミアム機能です</h3>
              <p className="text-gray-600 mt-2">
                高度な検索・フィルタ機能をご利用いただくには、プレミアムプランにアップグレードしてください。
              </p>
            </div>
            <Button onClick={() => window.location.href = '/premium'}>
              プレミアムプランを見る
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          高度な検索・フィルタ
        </CardTitle>
        <CardDescription>
          詳細な条件で授業を検索できます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* キーワード検索 */}
        <div className="space-y-2">
          <Label htmlFor="keyword">キーワード</Label>
          <Input
            id="keyword"
            placeholder="授業名、内容、キーワードで検索"
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 学科選択 */}
          <div className="space-y-2">
            <Label>学科</Label>
            <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="学科を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 担当教員 */}
          <div className="space-y-2">
            <Label htmlFor="instructor">担当教員</Label>
            <Input
              id="instructor"
              placeholder="教員名で検索"
              value={filters.instructor}
              onChange={(e) => handleFilterChange('instructor', e.target.value)}
            />
          </div>
        </div>

        {/* 難易度 */}
        <div className="space-y-3">
          <Label>難易度</Label>
          <div className="px-3">
            <Slider
              value={filters.difficulty}
              onValueChange={(value) => handleFilterChange('difficulty', value)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>易しい (1)</span>
              <span>普通 (3)</span>
              <span>難しい (5)</span>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium">
                {filters.difficulty[0]} 〜 {filters.difficulty[1]}
              </span>
            </div>
          </div>
        </div>

        {/* 評価 */}
        <div className="space-y-3">
          <Label>評価</Label>
          <div className="px-3">
            <Slider
              value={filters.rating}
              onValueChange={(value) => handleFilterChange('rating', value)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>★1</span>
              <span>★★★</span>
              <span>★★★★★</span>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium">
                ★{filters.rating[0]} 〜 ★{filters.rating[1]}
              </span>
            </div>
          </div>
        </div>

        {/* 単位数 */}
        <div className="space-y-3">
          <Label>単位数</Label>
          <div className="px-3">
            <Slider
              value={filters.credits}
              onValueChange={(value) => handleFilterChange('credits', value)}
              min={1}
              max={4}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1単位</span>
              <span>2単位</span>
              <span>3単位</span>
              <span>4単位</span>
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-medium">
                {filters.credits[0]} 〜 {filters.credits[1]}単位
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 学期 */}
          <div className="space-y-2">
            <Label>学期</Label>
            <Select value={filters.semester} onValueChange={(value) => handleFilterChange('semester', value)}>
              <SelectTrigger>
                <SelectValue placeholder="学期を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="spring">春学期</SelectItem>
                <SelectItem value="fall">秋学期</SelectItem>
                <SelectItem value="intensive">集中講義</SelectItem>
                <SelectItem value="year_round">通年</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 年度 */}
          <div className="space-y-2">
            <Label>年度</Label>
            <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
              <SelectTrigger>
                <SelectValue placeholder="年度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべて</SelectItem>
                <SelectItem value="2024">2024年度</SelectItem>
                <SelectItem value="2023">2023年度</SelectItem>
                <SelectItem value="2022">2022年度</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 授業形式 */}
        <div className="space-y-3">
          <Label>授業形式</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COURSE_TYPES.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.courseType.includes(type)}
                  onCheckedChange={(checked) => handleCourseTypeChange(type, checked as boolean)}
                />
                <Label htmlFor={`type-${type}`} className="text-sm font-normal">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 特徴 */}
        <div className="space-y-3">
          <Label>特徴</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map(feature => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={filters.features.includes(feature)}
                  onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                />
                <Label htmlFor={`feature-${feature}`} className="text-sm font-normal">
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* カスタムタグ */}
        <div className="space-y-3">
          <Label>カスタムタグ</Label>
          <div className="flex gap-2">
            <Input
              placeholder="タグを追加"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
            />
            <Button onClick={addCustomTag} size="sm">
              追加
            </Button>
          </div>
          {filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSearch} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            検索実行
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            <Filter className="w-4 h-4 mr-2" />
            リセット
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}