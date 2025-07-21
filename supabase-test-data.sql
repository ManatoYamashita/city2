-- テストデータ投入用SQL
-- Supabase SQL Editorで実行

-- 1. 大学データ
INSERT INTO universities (name, short_name, location) VALUES
('東京大学', '東大', '東京都文京区'),
('早稲田大学', '早稲田', '東京都新宿区'),
('慶應義塾大学', '慶應', '東京都港区');

-- 2. 授業データ
INSERT INTO courses (university_id, course_code, name, instructor, department, faculty, credits, semester, category, description) VALUES
(
  (SELECT id FROM universities WHERE short_name = '東大'),
  'CS101',
  'コンピュータサイエンス入門',
  '田中太郎',
  'コンピュータサイエンス専攻',
  '工学部',
  2,
  '前期',
  '必修',
  'コンピュータサイエンスの基礎概念を学ぶ入門科目です。プログラミングの基本からアルゴリズム、データ構造まで幅広くカバーします。'
),
(
  (SELECT id FROM universities WHERE short_name = '東大'),
  'MATH201',
  '微分積分学II',
  '佐藤花子',
  '数学専攻',
  '理学部',
  3,
  '後期',
  '必修',
  '多変数関数の微分積分を扱います。偏微分、重積分、線積分などの概念を学習します。'
),
(
  (SELECT id FROM universities WHERE short_name = '早稲田'),
  'ENG101',
  '学術英語',
  'John Smith',
  '英語専攻',
  '文学部',
  2,
  '通年',
  '必修',
  'アカデミックライティングとリーディングスキルの向上を目指します。'
),
(
  (SELECT id FROM universities WHERE short_name = '慶應'),
  'ECON301',
  'ミクロ経済学',
  '鈴木一郎',
  '経済学専攻',
  '経済学部',
  4,
  '前期',
  '必修',
  '市場メカニズムと個人・企業の意思決定について理論的に学習します。'
);

-- 注意: レビューデータは実際のユーザーアカウント作成後に投入してください
-- 以下はユーザー登録後に手動で投入可能なサンプルです

-- INSERT INTO reviews (course_id, user_id, overall_rating, difficulty, workload, title, content, pros, cons, advice) VALUES
-- (
--   (SELECT id FROM courses WHERE course_code = 'CS101'),
--   'user-uuid-here',
--   4,
--   3,
--   3,
--   '基礎をしっかり学べる良い授業',
--   'プログラミング初心者にも分かりやすく説明してくれます。課題も適量で無理なく進められます。',
--   '分かりやすい説明、充実した演習',
--   '進度がやや遅い',
--   '予習復習をしっかりやれば確実に力がつきます'
-- );