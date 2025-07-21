-- ============================================================================
-- City2 大学授業レビュープラットフォーム - 完全データベースセットアップ
-- ============================================================================
-- このファイルをSupabase SQL Editorで実行してください
-- 実行順序: 1. 基本スキーマ → 2. 決済システム → 3. 管理者機能 → 4. RLS → 5. 初期データ

-- ============================================================================
-- 1. 基本スキーマ（Phase 1 & 2）
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50) NOT NULL UNIQUE,
  location VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  display_name VARCHAR(100),
  student_id VARCHAR(50),
  admission_year INTEGER CHECK (admission_year >= 1900 AND admission_year <= 2030), -- 入学年度
  department VARCHAR(100),
  faculty VARCHAR(100),
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  instructor VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  faculty VARCHAR(100),
  credits INTEGER NOT NULL CHECK (credits > 0),
  semester VARCHAR(20), -- '前期', '後期', '通年', '集中'
  year INTEGER, -- 開講年度
  category VARCHAR(50), -- '必修', '選択', '自由'
  description TEXT,
  syllabus_url TEXT,
  
  -- 集計データ（トリガーで自動更新）
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  average_difficulty DECIMAL(3,2) DEFAULT 0,
  average_workload DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(university_id, course_code, year, semester)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 評価項目（5段階評価）
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  workload INTEGER NOT NULL CHECK (workload >= 1 AND workload <= 5),
  
  -- テキストレビュー
  title VARCHAR(200),
  content TEXT NOT NULL,
  pros TEXT,
  cons TEXT,
  advice TEXT,
  
  -- 匿名化情報
  anonymous_admission_year INTEGER,
  anonymous_department VARCHAR(100),
  
  -- メタデータ
  attendance_required BOOLEAN,
  test_difficulty INTEGER CHECK (test_difficulty >= 1 AND test_difficulty <= 5),
  assignment_frequency VARCHAR(20), -- 'なし', '少ない', '普通', '多い', '非常に多い'
  grading_criteria VARCHAR(20), -- '甘い', '普通', '厳しい'
  
  -- 管理・モデレーション
  is_verified BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(course_id, user_id) -- 1つの授業に対してユーザーは1つのレビューのみ
);

-- Review helpful votes table
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

-- Past exams table (Premium feature)
CREATE TABLE IF NOT EXISTS past_exams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  exam_type VARCHAR(50) NOT NULL, -- '中間', '期末', 'レポート', 'その他'
  year INTEGER NOT NULL,
  semester VARCHAR(20),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(50),
  
  -- メタデータ
  description TEXT,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  time_limit INTEGER, -- 分
  
  -- 管理
  is_verified BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. Stripe決済システム（Phase 3）
-- ============================================================================

-- Stripe顧客テーブル
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サブスクリプションテーブル
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 請求履歴テーブル
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- 金額（最小通貨単位）
  currency TEXT NOT NULL DEFAULT 'jpy',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description TEXT,
  invoice_url TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 使用量制限テーブル
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  review_count INTEGER DEFAULT 0,
  past_exam_downloads INTEGER DEFAULT 0,
  analytics_views INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. 管理者機能
-- ============================================================================

-- 管理者ユーザーテーブル
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- 管理者アクションログテーブル
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'course', 'review', 'subscription', 'system')),
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- システム設定テーブル
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レビュー報告テーブル
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー状態管理テーブル
CREATE TABLE IF NOT EXISTS user_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    reason TEXT,
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- 4. インデックス
-- ============================================================================

-- パフォーマンス用インデックス
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor);
CREATE INDEX IF NOT EXISTS idx_courses_average_rating ON courses(average_rating DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_past_exams_course_id ON past_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_past_exams_year ON past_exams(year DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- ============================================================================
-- 5. トリガー関数
-- ============================================================================

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
DROP TRIGGER IF EXISTS update_universities_updated_at ON universities;
CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_past_exams_updated_at ON past_exams;
CREATE TRIGGER update_past_exams_updated_at BEFORE UPDATE ON past_exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 授業統計の自動更新トリガー
CREATE OR REPLACE FUNCTION update_course_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics for the affected course
    UPDATE courses 
    SET 
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        average_difficulty = (
            SELECT COALESCE(AVG(difficulty), 0) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        average_workload = (
            SELECT COALESCE(AVG(workload), 0) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_course_stats_on_review_insert ON reviews;
CREATE TRIGGER update_course_stats_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_statistics();

DROP TRIGGER IF EXISTS update_course_stats_on_review_update ON reviews;
CREATE TRIGGER update_course_stats_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_statistics();

DROP TRIGGER IF EXISTS update_course_stats_on_review_delete ON reviews;
CREATE TRIGGER update_course_stats_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_statistics();

-- レビューの役立ち度カウント更新トリガー
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reviews 
    SET helpful_count = (
        SELECT COUNT(*) 
        FROM review_votes 
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
        AND vote_type = 'helpful'
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_helpful_count_on_vote_insert ON review_votes;
CREATE TRIGGER update_helpful_count_on_vote_insert
    AFTER INSERT ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

DROP TRIGGER IF EXISTS update_helpful_count_on_vote_update ON review_votes;
CREATE TRIGGER update_helpful_count_on_vote_update
    AFTER UPDATE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

DROP TRIGGER IF EXISTS update_helpful_count_on_vote_delete ON review_votes;
CREATE TRIGGER update_helpful_count_on_vote_delete
    AFTER DELETE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

-- 新規ユーザー登録時のプロファイル自動作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, created_at, updated_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 6. Row Level Security (RLS) ポリシー
-- ============================================================================

-- プロファイルテーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- レビューテーブルのRLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 授業テーブルのRLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
CREATE POLICY "Anyone can view courses"
ON courses FOR SELECT
TO anon, authenticated
USING (true);

-- サブスクリプションテーブルのRLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 7. 分析用ビュー
-- ============================================================================

-- 入学年度別統計ビュー
CREATE OR REPLACE VIEW user_admission_year_stats AS
SELECT 
    admission_year,
    COUNT(*) as user_count,
    COUNT(CASE WHEN is_premium = true THEN 1 END) as premium_count,
    ROUND(COUNT(CASE WHEN is_premium = true THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as premium_rate
FROM profiles 
WHERE admission_year IS NOT NULL
GROUP BY admission_year
ORDER BY admission_year DESC;

-- 授業評価統計ビュー
CREATE OR REPLACE VIEW course_review_stats AS
SELECT 
    c.id,
    c.name,
    c.instructor,
    c.department,
    c.faculty,
    c.total_reviews,
    c.average_rating,
    c.average_difficulty,
    c.average_workload,
    COUNT(DISTINCT r.user_id) as unique_reviewers,
    AVG(CASE WHEN p.admission_year IS NOT NULL 
        THEN EXTRACT(YEAR FROM NOW()) - p.admission_year + 1 
        END) as avg_reviewer_year
FROM courses c
LEFT JOIN reviews r ON c.id = r.course_id
LEFT JOIN profiles p ON r.user_id = p.id
GROUP BY c.id, c.name, c.instructor, c.department, c.faculty, 
         c.total_reviews, c.average_rating, c.average_difficulty, c.average_workload;

-- 管理者ダッシュボード統計ビュー
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE is_premium = true) as premium_users,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM reviews) as total_reviews,
    (SELECT COALESCE(AVG(overall_rating), 0) FROM reviews) as avg_rating,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COALESCE(SUM(amount), 0) FROM billing_history WHERE status = 'paid') as total_revenue;

-- ============================================================================
-- 8. 初期データ
-- ============================================================================

-- 大学データ
INSERT INTO universities (name, short_name, location, website) 
VALUES ('東京都市大学', 'TCU', '東京都世田谷区', 'https://www.tcu.ac.jp')
ON CONFLICT (short_name) DO NOTHING;

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
  'プログラミングの基本概念を学ぶ授業です。C言語を中心とした実習を行います。'
FROM universities u
WHERE u.short_name = 'TCU'
ON CONFLICT (university_id, course_code, year, semester) DO NOTHING;

INSERT INTO courses (university_id, course_code, name, instructor, department, faculty, credits, semester, year, category, description)
SELECT 
  u.id,
  'MATH201',
  '微分積分学',
  '佐藤教授',
  '数学専攻',
  '理学部',
  4,
  '通年',
  2024,
  '必修',
  '1変数および多変数関数の微分・積分を学習します。理工系の基礎となる重要な科目です。'
FROM universities u
WHERE u.short_name = 'TCU'
ON CONFLICT (university_id, course_code, year, semester) DO NOTHING;

INSERT INTO courses (university_id, course_code, name, instructor, department, faculty, credits, semester, year, category, description)
SELECT 
  u.id,
  'ENG301',
  '英語コミュニケーション',
  'Smith教授',
  '英語専攻',
  '文学部',
  2,
  '後期',
  2024,
  '選択',
  '実践的な英語コミュニケーション能力を身に付ける授業です。プレゼンテーションやディスカッションを中心に行います。'
FROM universities u
WHERE u.short_name = 'TCU'
ON CONFLICT (university_id, course_code, year, semester) DO NOTHING;

-- システム設定の初期化
INSERT INTO system_settings (key, value, description)
VALUES 
  ('max_reviews_per_user', '10', 'ユーザーあたりの最大レビュー数'),
  ('max_file_size_mb', '50', 'アップロード可能な最大ファイルサイズ（MB）'),
  ('premium_price_monthly', '980', 'プレミアムプランの月額料金（円）'),
  ('premium_price_yearly', '9800', 'プレミアムプランの年額料金（円）')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- セットアップ完了メッセージ
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'City2 データベースセットアップが完了しました！';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- universities: 大学情報';
    RAISE NOTICE '- profiles: ユーザープロファイル';
    RAISE NOTICE '- courses: 授業情報';
    RAISE NOTICE '- reviews: レビュー';
    RAISE NOTICE '- review_votes: レビュー投票';
    RAISE NOTICE '- past_exams: 過去問（プレミアム機能）';
    RAISE NOTICE '- subscriptions: サブスクリプション';
    RAISE NOTICE '- billing_history: 請求履歴';
    RAISE NOTICE '- admin_users: 管理者ユーザー';
    RAISE NOTICE '- admin_action_logs: 管理者アクションログ';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'アプリケーションでログインを試してください。';
    RAISE NOTICE '============================================================================';
END $$;