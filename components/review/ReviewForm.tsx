'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RatingStars } from './RatingStars'
import { reviewFormSchema, ReviewFormData, ASSIGNMENT_FREQUENCY_LABELS, GRADING_CRITERIA_LABELS } from '@/lib/validations/review'
import { Course } from '@/types/course'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  course: Course
  onSuccess?: () => void
  className?: string
}

export function ReviewForm({ course, onSuccess, className }: ReviewFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      overall_rating: 0,
      difficulty: 0,
      workload: 0,
      title: '',
      content: '',
      pros: '',
      cons: '',
      advice: '',
      attendance_required: false,
      test_difficulty: 3,
      assignment_frequency: 'moderate',
      grading_criteria: 'fair',
    },
  })

  const onSubmit = async (data: ReviewFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: course.id,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'レビューの投稿に失敗しました')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/courses/${course.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レビューの投稿に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle>レビューを書く</CardTitle>
        <CardDescription>
          {course.name} ({course.course_code}) - {course.instructor}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 評価セクション */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">評価</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="overall_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>総合評価 *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <RatingStars
                            rating={field.value}
                            interactive
                            onChange={field.onChange}
                            size={24}
                          />
                          <p className="text-sm text-gray-600">
                            {field.value === 0 && 'クリックして評価してください'}
                            {field.value === 1 && '非常に悪い'}
                            {field.value === 2 && '悪い'}
                            {field.value === 3 && '普通'}
                            {field.value === 4 && '良い'}
                            {field.value === 5 && '非常に良い'}
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>難易度 *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <RatingStars
                            rating={field.value}
                            interactive
                            onChange={field.onChange}
                            size={24}
                          />
                          <p className="text-sm text-gray-600">
                            {field.value === 0 && 'クリックして評価してください'}
                            {field.value === 1 && '非常に易しい'}
                            {field.value === 2 && '易しい'}
                            {field.value === 3 && '普通'}
                            {field.value === 4 && '難しい'}
                            {field.value === 5 && '非常に難しい'}
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>課題量 *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <RatingStars
                            rating={field.value}
                            interactive
                            onChange={field.onChange}
                            size={24}
                          />
                          <p className="text-sm text-gray-600">
                            {field.value === 0 && 'クリックして評価してください'}
                            {field.value === 1 && '非常に軽い'}
                            {field.value === 2 && '軽い'}
                            {field.value === 3 && '普通'}
                            {field.value === 4 && '重い'}
                            {field.value === 5 && '非常に重い'}
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* レビュー内容 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">レビュー内容</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タイトル *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="レビューのタイトルを入力してください"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>レビュー内容 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="この授業についての詳細なレビューを書いてください（最低10文字）"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      後輩学生に役立つ具体的な情報を書いてください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="pros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>良い点</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="この授業の良かった点を教えてください"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>悪い点</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="この授業の改善してほしい点を教えてください"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>アドバイス</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="この授業を受ける後輩へのアドバイスをお願いします"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">詳細情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="attendance_required"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出席の必要性</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'true')}
                        defaultValue={field.value ? 'true' : 'false'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">必要</SelectItem>
                          <SelectItem value="false">不要</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="test_difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>テストの難易度</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <RatingStars
                            rating={field.value}
                            interactive
                            onChange={field.onChange}
                            size={20}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignment_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>課題の頻度</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ASSIGNMENT_FREQUENCY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grading_criteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>成績評価の厳しさ</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(GRADING_CRITERIA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '投稿中...' : 'レビューを投稿'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}