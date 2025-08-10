'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { courseCreateSchema, CourseCreateFormData } from '@/lib/validations/course'
import { Course } from '@/types/course'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface CourseRegistrationFormProps {
  onSuccess?: (course: Course) => void
  className?: string
}

interface DuplicateCheckResult {
  found: boolean
  courses: Course[]
  count: number
}

export function CourseRegistrationForm({ onSuccess, className }: CourseRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [confirmOverride, setConfirmOverride] = useState(false)
  const router = useRouter()

  const form = useForm<CourseCreateFormData>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      course_code: '',
      name: '',
      instructor: '',
      department: '',
      faculty: '',
      credits: 2,
      semester: '前期',
      year: new Date().getFullYear(),
      category: '選択',
      description: '',
      syllabus_url: '',
    },
  })

  const watchedValues = form.watch(['course_code', 'name', 'instructor'])

  // 重複チェック機能
  useEffect(() => {
    const checkDuplicate = async () => {
      const [course_code, name, instructor] = watchedValues
      
      if (!course_code && !name) return
      
      setIsCheckingDuplicate(true)
      
      try {
        const params = new URLSearchParams()
        if (course_code) params.append('course_code', course_code)
        if (name) params.append('name', name)
        if (instructor) params.append('instructor', instructor)
        
        const response = await fetch(`/api/courses/user-create?${params}`)
        if (response.ok) {
          const result: DuplicateCheckResult = await response.json()
          setDuplicateCheck(result)
        }
      } catch (error) {
        console.error('Duplicate check failed:', error)
      } finally {
        setIsCheckingDuplicate(false)
      }
    }

    const timeoutId = setTimeout(checkDuplicate, 500) // デバウンス
    return () => clearTimeout(timeoutId)
  }, [watchedValues])

  const onSubmit = async (data: CourseCreateFormData & { confirm_override?: boolean }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/courses/user-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          confirm_override: data.confirm_override || confirmOverride
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.confirm_required) {
          // 類似授業が見つかった場合の確認
          setDuplicateCheck({
            found: true,
            courses: result.similar_courses,
            count: result.similar_courses.length
          })
          setError(`${result.error} 下記の類似授業が見つかりました。`)
          setIsLoading(false)
          return
        }
        throw new Error(result.error || '授業の登録に失敗しました')
      }

      if (onSuccess && result.course) {
        onSuccess(result.course)
      } else {
        router.push(`/courses/${result.course.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '授業の登録に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmOverride = async () => {
    setConfirmOverride(true)
    setDuplicateCheck(null)
    setError(null)
    
    // confirm_overrideフラグを立てて再送信
    const formData = form.getValues()
    await onSubmit({ ...formData, confirm_override: true } as any)
  }

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle>新しい授業を登録</CardTitle>
        <CardDescription>
          授業一覧にない授業を新規登録できます。正確な情報を入力してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 基本情報セクション */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">基本情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="course_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>科目コード *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: CS101, MATH201"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        大学のシラバスに記載されている科目コードを入力
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>授業名 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: プログラミング基礎"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>教員名 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: 田中教授"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>単位数 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 詳細情報セクション */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">詳細情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学科・専攻</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: コンピュータサイエンス専攻"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学部</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例: 工学部"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開講時期</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="前期">前期</SelectItem>
                          <SelectItem value="後期">後期</SelectItem>
                          <SelectItem value="通年">通年</SelectItem>
                          <SelectItem value="集中">集中</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開講年度</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="2020"
                          max="2030"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>科目区分</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="必修">必修</SelectItem>
                          <SelectItem value="選択">選択</SelectItem>
                          <SelectItem value="自由">自由</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="syllabus_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>シラバスURL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        大学公式のシラバスページのURL（任意）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>授業概要</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="授業の内容や概要があれば記入してください"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      シラバスの内容やあなたが知っている授業の概要（任意）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 重複チェック結果の表示 */}
            {isCheckingDuplicate && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  類似授業をチェック中...
                </AlertDescription>
              </Alert>
            )}

            {duplicateCheck?.found && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">類似の授業が見つかりました:</p>
                    {duplicateCheck.courses.map((course, index) => (
                      <div key={course.id} className="p-2 bg-gray-50 rounded text-sm">
                        <p><strong>{course.name}</strong> ({course.course_code})</p>
                        <p>教員: {course.instructor} | {course.year}年度 {course.semester}</p>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setDuplicateCheck(null)
                          setError(null)
                        }}
                      >
                        入力を修正
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={handleConfirmOverride}
                      >
                        それでも登録する
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && !duplicateCheck?.found && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
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
              <Button 
                type="submit" 
                disabled={isLoading || (duplicateCheck?.found && !confirmOverride)}
              >
                {isLoading ? '登録中...' : '授業を登録'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}