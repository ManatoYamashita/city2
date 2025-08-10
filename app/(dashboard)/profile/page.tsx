'use client'

import React, { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormField,
} from '@/components/ui/form'

// フォームのバリデーションスキーマ
const profileSchema = z.object({
  display_name: z.string().min(2, '表示名は2文字以上で入力してください'),
  student_id: z.string().optional(),
  admission_year: z
    .string()
    .optional()
    .transform((val) => (val && val !== '' ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1900 && val <= 2030), {
      message: '入学年度は1900〜2030の範囲で入力してください',
    }),
  department: z.string().optional(),
  faculty: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-80 mt-2 animate-pulse" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="md:col-span-2 h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const defaultValues: ProfileFormData = useMemo(() => ({
    display_name: profile?.display_name || user?.user_metadata?.display_name || '',
    student_id: profile?.student_id || '',
    admission_year:
      typeof profile?.admission_year === 'number'
        ? String(profile?.admission_year)
        : undefined,
    department: profile?.department || '',
    faculty: profile?.faculty || '',
  }), [profile, user])

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onChange',
  })

  // プロフィールが更新されてきた場合にフォームを同期
  React.useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  // 送信処理
  const onSubmit = async (values: ProfileFormData) => {
    setSaveError(null)
    setSaveSuccess(null)
    setIsSaving(true)
    try {
      await updateProfile({
        display_name: values.display_name,
        student_id: values.student_id || undefined,
        admission_year: values.admission_year,
        department: values.department || undefined,
        faculty: values.faculty || undefined,
      })
      setSaveSuccess('プロフィールを更新しました')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <LoadingSkeleton />

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertDescription>ログインが必要です。</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-600 mt-2">アカウント情報とプロフィールを管理します</p>
      </div>

      {/* アカウント概要 */}
      <Card>
        <CardHeader>
          <CardTitle>アカウント</CardTitle>
          <CardDescription>ログインに使用するメールアドレスなどの情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">メールアドレス</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            {profile?.is_premium ? (
              <Badge className="bg-green-500">プレミアム</Badge>
            ) : (
              <Badge variant="outline">無料</Badge>
            )}
          </div>
          {profile?.premium_expires_at && (
            <p className="text-sm text-gray-600">
              プレミアム有効期限: {new Date(profile.premium_expires_at).toLocaleString()}
            </p>
          )}
          <div>
            <Button variant="outline" asChild>
              <a href="/dashboard/billing">請求管理</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* プロフィール編集 */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール編集</CardTitle>
          <CardDescription>表示名や学部・学科などを更新できます</CardDescription>
        </CardHeader>
        <CardContent>
          {saveError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          {saveSuccess && (
            <Alert className="mb-4">
              <AlertDescription>{saveSuccess}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>表示名</FormLabel>
                    <FormControl>
                      <Input placeholder="山田 太郎" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学籍番号</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 24ABC123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admission_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>入学年度</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="例: 2024" value={field.value ?? ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学部</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 工学部" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学科/専攻</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 情報工学科" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? '保存中…' : '保存する'}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset(defaultValues)} disabled={isSaving}>
                  変更をリセット
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}


