'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/lib/auth'
import { AuthError } from '@/lib/auth/helpers'

const resetSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
})

type ResetFormData = z.infer<typeof resetSchema>

export function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await resetPassword(data.email)
      setSuccess(true)
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('パスワードリセットメールの送信に失敗しました。再度お試しください。')
      }
      console.error('Password reset error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-green-600">
            メール送信完了
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>
            パスワードリセット用のメールを送信しました。
            メール内のリンクをクリックして、新しいパスワードを設定してください。
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">ログインページへ戻る</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSuccess(false)
                form.reset()
              }}
            >
              別のメールアドレスで再送信
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">パスワードリセット</CardTitle>
        <CardDescription className="text-center">
          登録したメールアドレスを入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your-email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '送信中...' : 'リセットメールを送信'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            <Link href="/login" className="text-blue-600 hover:underline">
              ログインページへ戻る
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}