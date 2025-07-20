-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universities table
CREATE TABLE universities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50) NOT NULL UNIQUE,
  location VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  display_name VARCHAR(100),
  student_id VARCHAR(50),
  grade INTEGER CHECK (grade >= 1 AND grade <= 6), -- 1-6年生
  department VARCHAR(100),
  faculty VARCHAR(100),
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
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
CREATE TABLE reviews (
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
  anonymous_grade INTEGER,
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
CREATE TABLE review_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(review_id, user_id)
);

-- Past exams table (Premium feature)
CREATE TABLE past_exams (
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

-- Stripe subscription data
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL,
  price_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_courses_university_id ON courses(university_id);
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_courses_instructor ON courses(instructor);
CREATE INDEX idx_courses_average_rating ON courses(average_rating DESC);

CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

CREATE INDEX idx_past_exams_course_id ON past_exams(course_id);
CREATE INDEX idx_past_exams_year ON past_exams(year DESC);

CREATE INDEX idx_profiles_university_id ON profiles(university_id);
CREATE INDEX idx_profiles_is_premium ON profiles(is_premium);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_past_exams_updated_at BEFORE UPDATE ON past_exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();