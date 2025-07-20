import { Metadata } from 'next'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'

export const metadata: Metadata = {
  title: 'パスワードリセット | City2',
  description: 'City2のパスワードをリセット',
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">City2</h1>
          <p className="text-gray-600 mt-2">大学授業レビュープラットフォーム</p>
        </div>
        <PasswordResetForm />
      </div>
    </div>
  )
}