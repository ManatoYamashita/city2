import { Metadata } from 'next'
import Link from 'next/link'
import { Home, BookOpen, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: {
    template: '%s | City2',
    default: 'City2 - 大学授業レビュープラットフォーム',
  },
  description: '履修登録に役立つ先輩学生のリアルな授業レビューをチェック',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ロゴ */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">City2</span>
              </Link>
            </div>

            {/* ナビゲーション */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home size={18} />
                <span>ホーム</span>
              </Link>
              <Link
                href="/courses"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Search size={18} />
                <span>授業検索</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <User size={18} />
                <span>プロフィール</span>
              </Link>
            </nav>

            {/* ユーザーメニュー */}
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/courses">授業を探す</Link>
              </Button>
              <Button asChild>
                <Link href="/logout">ログアウト</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">City2</span>
              </div>
              <p className="text-sm text-gray-600">
                大学生向け授業レビュープラットフォーム。
                先輩学生のリアルな授業情報で、履修登録をサポートします。
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                サービス
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/courses" className="hover:text-gray-900">
                    授業検索
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="hover:text-gray-900">
                    レビュー一覧
                  </Link>
                </li>
                <li>
                  <Link href="/premium" className="hover:text-gray-900">
                    プレミアム機能
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                サポート
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/help" className="hover:text-gray-900">
                    ヘルプ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-gray-900">
                    お問い合わせ
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-gray-900">
                    プライバシーポリシー
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-gray-900">
                    利用規約
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            <p>&copy; 2024 City2. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}