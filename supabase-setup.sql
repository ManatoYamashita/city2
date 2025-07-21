-- City2 データベーススキーマ設定
-- Supabase SQL Editorで実行してください

-- 1. 大学テーブル
CREATE TABLE universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  location TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 授業テーブル
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  name TEXT NOT NULL,
  instructor TEXT NOT NULL,
  department TEXT,
  faculty TEXT,
  credits INTEGER NOT NULL DEFAULT 1,
  semester TEXT,
  year INTEGER,
  category TEXT,
  description TEXT,
  syllabus_url TEXT,
  
  -- 集計データ（レビューから計算）
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  average_difficulty DECIMAL(3,2) DEFAULT 0,
  average_workload DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(university_id, course_code)
);

-- 3. レビューテーブル
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 評価項目（1-5の5段階評価）
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  workload INTEGER NOT NULL CHECK (workload >= 1 AND workload <= 5),
  
  -- テキストレビュー
  title TEXT,
  content TEXT NOT NULL,
  pros TEXT,
  cons TEXT,
  advice TEXT,
  
  -- 匿名化情報
  anonymous_grade INTEGER,
  anonymous_department TEXT,
  
  -- メタデータ
  attendance_required BOOLEAN,
  test_difficulty INTEGER CHECK (test_difficulty >= 1 AND test_difficulty <= 5),
  assignment_frequency TEXT CHECK (assignment_frequency IN ('none', 'light', 'moderate', 'heavy', 'very_heavy')),
  grading_criteria TEXT CHECK (grading_criteria IN ('lenient', 'fair', 'strict')),
  
  -- 管理・モデレーション
  is_verified BOOLEAN DEFAULT FALSE,
  is_reported BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 1つの授業につき1ユーザー1レビューまで
  UNIQUE(course_id, user_id)
);

-- 4. レビュー役立つ投票テーブル
CREATE TABLE review_helpful_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

-- 5. インデックス作成
CREATE INDEX idx_courses_university_id ON courses(university_id);
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_instructor ON courses(instructor);
CREATE INDEX idx_courses_department ON courses(department);
CREATE INDEX idx_courses_faculty ON courses(faculty);
CREATE INDEX idx_courses_average_rating ON courses(average_rating);
CREATE INDEX idx_courses_total_reviews ON courses(total_reviews);

CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_helpful_count ON reviews(helpful_count);

-- 6. Row Level Security (RLS) 有効化
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- 7. RLSポリシー設定

-- 大学テーブル: 全員読み取り可能、認証ユーザーは作成可能
CREATE POLICY "universities_select" ON universities FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "universities_insert" ON universities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "universities_update" ON universities FOR UPDATE TO authenticated USING (true);

-- 授業テーブル: 全員読み取り可能、認証ユーザーは作成可能
CREATE POLICY "courses_select" ON courses FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "courses_insert" ON courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "courses_update" ON courses FOR UPDATE TO authenticated USING (true);

-- レビューテーブル: 全員読み取り可能、自分のレビューのみ編集可能
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 役立つ投票テーブル: 認証ユーザーのみアクセス可能
CREATE POLICY "review_helpful_votes_select" ON review_helpful_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "review_helpful_votes_insert" ON review_helpful_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "review_helpful_votes_delete" ON review_helpful_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. トリガー関数: レビュー集計データ更新
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses 
  SET 
    total_reviews = (
      SELECT COUNT(*) FROM reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    average_rating = (
      SELECT COALESCE(AVG(overall_rating), 0) FROM reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    average_difficulty = (
      SELECT COALESCE(AVG(difficulty), 0) FROM reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    average_workload = (
      SELECT COALESCE(AVG(workload), 0) FROM reviews WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER trigger_update_course_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_course_stats();

-- 9. トリガー関数: 役立つ投票数更新
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews 
  SET helpful_count = (
    SELECT COUNT(*) FROM review_helpful_votes WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR DELETE ON review_helpful_votes
  FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- 10. updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atトリガー設定
CREATE TRIGGER trigger_universities_updated_at BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();