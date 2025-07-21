import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Star, Users, Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'City2 - 大学授業レビュープラットフォーム',
  description: '履修登録に役立つ先輩学生のリアルな授業レビューをチェック。大学生活をより充実させるための情報を提供します。',
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">City2</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button asChild>
                <Link href="/register">新規登録</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            履修選択を
            <span className="text-blue-600">スマートに</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            先輩学生のリアルな授業レビューで、あなたの大学生活をより充実させませんか？
            City2は履修登録をサポートする学生のためのプラットフォームです。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register" className="flex items-center gap-2">
                今すぐ始める
                <ArrowRight size={20} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/courses">授業を検索</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              City2の特徴
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              学生による、学生のための授業レビュープラットフォーム
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Star}
              title="詳細なレビュー"
              description="総合評価、難易度、課題量など多角的な評価で授業の実態を把握できます"
            />
            <FeatureCard
              icon={Users}
              title="匿名投稿"
              description="学年・学部情報のみ表示される匿名システムで、安心してレビューを投稿できます"
            />
            <FeatureCard
              icon={Search}
              title="高度な検索"
              description="授業名、教員名、学部、評価など様々な条件で目的の授業を素早く見つけられます"
            />
          </div>
        </div>
      </section>

      {/* 統計セクション */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1,200+</div>
              <div className="text-gray-600">登録授業数</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">3,800+</div>
              <div className="text-gray-600">投稿レビュー数</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">850+</div>
              <div className="text-gray-600">アクティブユーザー数</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            今すぐCity2を始めよう
          </h2>
          <p className="text-gray-600 mb-8">
            アカウント作成は無料です。あなたの履修選択をサポートし、
            後輩学生のためにレビューを共有しましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">無料でアカウント作成</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/courses">授業を探す</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <span className="text-xl font-bold">City2</span>
              </div>
              <p className="text-gray-400">
                学生による、学生のための授業レビュープラットフォーム
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">サービス</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/courses" className="hover:text-white">授業検索</Link></li>
                <li><Link href="/reviews" className="hover:text-white">レビュー一覧</Link></li>
                <li><Link href="/premium" className="hover:text-white">プレミアム機能</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">ヘルプ</Link></li>
                <li><Link href="/contact" className="hover:text-white">お問い合わせ</Link></li>
                <li><Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="hover:text-white">利用規約</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; 2024 City2. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
