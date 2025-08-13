# City2 - 大学授業レビュープラットフォーム

**City2**は大学生の履修選択をサポートする授業レビュープラットフォームです。先輩学生のリアルな授業レビューと評価を通じて、より良い履修計画の策定を支援します。

## プロジェクト概要

### 主要機能

- **授業レビューシステム**: 5段階評価による詳細な授業レビュー
- **ユーザー認証**: Supabase Authによるセキュアな認証システム
- **プレミアム機能**: Stripe決済による有料機能（過去問アクセス、高度な検索等）
- **管理者ダッシュボード**: ユーザー管理、支払い管理、分析機能
- **匿名レビュー**: プライバシーを重視した匿名投稿システム
- **高度な検索機能**: 授業名、教員名、学部、評価による多角的検索

### 対象ユーザー

- **大学生**: 履修選択で迷っている学生
- **授業受講経験者**: 後輩のためにレビューを投稿する学生
- **管理者**: プラットフォームの運営・管理を行うスタッフ

## 技術スタック

### フロントエンド
- **Next.js 15** - App Routerによるモダンなフロントエンド開発
- **React 19** - コンポーネントベースのUI構築
- **TypeScript 5** - 型安全な開発環境
- **TailwindCSS 4** - ユーティリティファーストのスタイリング
- **ShadcnUI** - アクセシブルなUIコンポーネントライブラリ

### バックエンド・インフラ
- **Supabase** - PostgreSQLデータベース、認証、リアルタイム機能
- **Stripe** - 決済処理とサブスクリプション管理
- **Vercel** - ホスティングとデプロイメント（推奨）

### 開発ツール
- **ESLint** - コード品質管理
- **Prettier** - コードフォーマッター
- **Zod** - スキーマバリデーション
- **React Hook Form** - フォーム状態管理

## セットアップ

### 前提条件

- Node.js 18.17以上
- npm、yarn、pnpm、またはbunパッケージマネージャー
- Supabaseアカウント
- Stripeアカウント（プレミアム機能を使用する場合）

### インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/your-username/city2.git
   cd city2
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   # または
   yarn install
   # または
   pnpm install
   # または
   bun install
   ```

3. **環境変数の設定**
   
   `.env.local`ファイルを作成し、以下の環境変数を設定：
   ```bash
   # Supabase設定
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Stripe設定
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # アプリケーション設定
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **データベースセットアップ**
   
   詳細な手順は`SETUP_DATABASE.md`を参照してください。
   ```bash
   # データベース設定検証スクリプト実行
   npx tsx scripts/verify-supabase-setup.ts
   ```

5. **開発サーバーの起動**
   ```bash
   npm run dev
   # または
   yarn dev
   # または
   pnpm dev
   # または
   bun dev
   ```

   ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセス

## プロジェクト構造

```
city2/
├── app/                       # Next.js 15 App Router
│   ├── (auth)/               # 認証関連ページ (login, register, reset-password)
│   ├── (dashboard)/          # メインアプリケーション
│   │   ├── courses/          # 授業関連ページ
│   │   ├── dashboard/        # ダッシュボード
│   │   ├── premium/          # プレミアム機能
│   │   └── checkout/         # 決済ページ
│   ├── (admin)/              # 管理者機能
│   │   └── admin/            # 管理者ダッシュボード
│   └── api/                  # APIルート
├── components/               # 再利用可能なUIコンポーネント
│   ├── auth/                 # 認証関連コンポーネント
│   ├── course/               # 授業関連コンポーネント
│   ├── review/               # レビュー関連コンポーネント
│   ├── stripe/               # 決済関連コンポーネント
│   └── ui/                   # ShadcnUIコンポーネント
├── lib/                      # ユーティリティとライブラリ
│   ├── supabase/             # Supabaseクライアント
│   ├── stripe/               # Stripe設定
│   ├── auth/                 # 認証ヘルパー
│   └── validations/          # Zodスキーマ
├── hooks/                    # カスタムReactフック
├── types/                    # TypeScript型定義
└── docs/                     # プロジェクトドキュメント
```

## 開発コマンド

### 基本的なコマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# リンター実行
npm run lint
```

### データベース関連

```bash
# Supabaseセットアップ検証
npx tsx scripts/verify-supabase-setup.ts
```

### コンポーネント追加

```bash
# ShadcnUIコンポーネント追加
npx shadcn@latest add [component-name]
```

## 主要機能

### 1. 認証システム
- メールアドレスとパスワードによる認証
- パスワードリセット機能
- セキュアなセッション管理

### 2. 授業レビュー
- 5段階評価による総合評価
- 難易度、課題量、出席重要度の個別評価
- テキストレビューの投稿
- 匿名システムによるプライバシー保護

### 3. 検索・フィルター
- 授業名、教員名、学部による検索
- 評価、難易度、学年による絞り込み
- ソート機能（評価順、投稿日順等）

### 4. プレミアム機能
- 過去問へのアクセス
- 高度な検索フィルター
- データ分析ダッシュボード
- Stripeによる安全な決済処理

### 5. 管理者機能
- ユーザー管理
- 支払い管理
- プラットフォーム分析
- コンテンツモデレーション

## セキュリティ

### データ保護
- **Row Level Security (RLS)**: Supabaseによるデータアクセス制御
- **JWT認証**: セキュアなトークンベース認証
- **暗号化**: 保存データと通信の暗号化
- **匿名化**: ユーザープライバシーの保護

### 入力検証
- **Zodスキーマ**: 型安全な入力バリデーション
- **XSS対策**: 適切なサニタイゼーション
- **CSRF対策**: トークンベースの保護

## デプロイメント

### Vercel (推奨)

1. **Vercelアカウント作成**: [vercel.com](https://vercel.com)
2. **GitHubリポジトリ連携**: Vercelダッシュボードでリポジトリを選択
3. **環境変数設定**: Vercelの設定画面で環境変数を追加
4. **自動デプロイ**: コミット時の自動デプロイ設定

### その他のプラットフォーム

Next.js 15は以下のプラットフォームにもデプロイ可能：
- Netlify
- AWS Amplify
- Railway
- Heroku

詳細は[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)を参照

## 貢献

### 開発の流れ

1. **Issue作成**: 機能追加やバグ報告
2. **ブランチ作成**: `feature/xxx`または`fix/xxx`
3. **コード実装**: 品質基準に従った実装
4. **テスト**: 動作確認とテストコード作成
5. **プルリクエスト**: レビュー依頼
6. **マージ**: 承認後のメインブランチへの統合

### コーディング規約

- **TypeScript**: 型安全性を重視
- **ESLint/Prettier**: 自動フォーマッティング
- **コンポーネント設計**: 再利用可能で保守しやすい設計
- **アクセシビリティ**: WCAG 2.1準拠

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - 環境変数の確認
   - Supabaseプロジェクトの設定確認
   - `SETUP_DATABASE.md`の手順に従ったセットアップ

2. **認証エラー**
   - Supabase認証設定の確認
   - メールテンプレート設定の確認

3. **決済機能エラー**
   - Stripe APIキーの確認
   - Webhookエンドポイントの設定確認

## サポート・ドキュメント

- **技術詳細**: `docs/technical-overview.md`
- **ユーザーガイド**: `docs/user-guide.md`
- **管理者機能**: `docs/features-admin.md`
- **セキュリティ**: `docs/business-security.md`
- **データベース設定**: `SETUP_DATABASE.md`

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は`LICENSE`ファイルを参照してください。

## お問い合わせ

- **プロジェクト管理者**: [GitHub Issues](https://github.com/your-username/city2/issues)
- **セキュリティ関連**: security@city2.example.com
- **一般的なお問い合わせ**: contact@city2.example.com

---

**City2**で、あなたの大学生活をより充実したものにしましょう！
