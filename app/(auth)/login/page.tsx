import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'ログイン | City2',
  description: 'City2にログインして授業レビューをチェック',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">City2</h1>
          <p className="text-gray-600 mt-2">大学授業レビュープラットフォーム</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}