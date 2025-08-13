# City2 データベースセットアップガイド

## Supabaseデータベーススキーマの設定

ログインエラー「relation "public.profiles" does not exist」を解決するために、Supabaseプロジェクトにデータベーススキーマを適用する必要があります。

## 手順

### 1. Supabase管理画面にアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `bpxbgwumvbdefzyzykgh` を選択
3. 左メニューから「SQL Editor」をクリック

### 2. 基本スキーマの適用

「SQL Editor」で以下のファイルの内容をコピー＆ペーストして実行：

```sql
-- ファイル: supabase/migrations/001_initial_schema.sql の内容をコピー
```

### 3. Stripe決済スキーマの適用（Phase 3）

```sql
-- ファイル: supabase-phase3-schema.sql の内容をコピー
```

### 4. 管理者機能スキーマの適用

```sql
-- ファイル: supabase-admin-schema.sql の内容をコピー
```

### 5. Row Level Security (RLS) の設定

以下のRLSポリシーを設定：

```sql
-- プロファイルテーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- レビューテーブルのRLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 授業テーブルのRLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
ON courses FOR SELECT
TO anon, authenticated
USING (true);
```

### 6. 初期データの投入

```sql
-- 大学データ
INSERT INTO universities (name, short_name, location, website) 
VALUES ('東京都市大学', 'TCU', '東京都世田谷区', 'https://www.tcu.ac.jp');

-- サンプル授業データ
INSERT INTO courses (university_id, course_code, name, instructor, department, faculty, credits, semester, year, category, description)
SELECT 
  u.id,
  'CS101',
  'プログラミング基礎',
  '田中教授',
  'コンピュータサイエンス専攻',
  '工学部',
  2,
  '前期',
  2024,
  '必修',
  'プログラミングの基本概念を学ぶ授業です。'
FROM universities u
WHERE u.short_name = 'TCU';
```

## 実行順序

1. **001_initial_schema.sql** （基本テーブル）
2. **supabase-phase3-schema.sql** （Stripe決済関連）
3. **supabase-admin-schema.sql** （管理者機能）
4. **RLSポリシー設定**
5. **初期データ投入**

## 確認方法

1. Supabase Dashboard の「Table Editor」でテーブルが作成されていることを確認
2. アプリケーションでログインを試行
3. エラーが解消されていることを確認

## トラブルシューティング

### よくあるエラー

1. **Permission denied**: RLSポリシーが正しく設定されているか確認
2. **Function does not exist**: 拡張機能（uuid-ossp）が有効になっているか確認
3. **Foreign key constraint**: テーブル作成順序を確認

### サポート

問題が発生した場合は、Supabase Dashboardの「Logs」セクションでエラーログを確認してください。

---

**注意**: 本番環境では、データのバックアップを取ってからスキーマ変更を実行してください。