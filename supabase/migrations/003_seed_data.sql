-- Insert sample university data
INSERT INTO universities (id, name, short_name, location, website) VALUES 
(
    uuid_generate_v4(),
    '東京大学',
    'UTokyo',
    '東京都文京区本郷7-3-1',
    'https://www.u-tokyo.ac.jp'
);

-- Get the university ID for subsequent inserts
WITH university_data AS (
    SELECT id as university_id FROM universities WHERE short_name = 'UTokyo'
)
-- Insert sample course data
INSERT INTO courses (
    university_id, 
    course_code, 
    name, 
    instructor, 
    department, 
    faculty, 
    credits, 
    semester, 
    year, 
    category,
    description
)
SELECT 
    university_id,
    'CS101',
    'コンピュータサイエンス入門',
    '田中太郎',
    'コンピュータサイエンス専攻',
    '工学部',
    2,
    '前期',
    2024,
    '必修',
    'プログラミングの基礎からアルゴリズムまでを学ぶ入門科目です。'
FROM university_data
UNION ALL
SELECT 
    university_id,
    'MATH201',
    '微分積分学II',
    '佐藤花子',
    '数学専攻',
    '理学部',
    4,
    '後期',
    2024,
    '必修',
    '微分積分の応用と多変数関数について学びます。'
FROM university_data
UNION ALL
SELECT 
    university_id,
    'ENG301',
    '学術英語',
    'John Smith',
    '英語専攻',
    '文学部',
    2,
    '通年',
    2024,
    '選択',
    '学術論文の読み書きとプレゼンテーション技法を習得します。'
FROM university_data
UNION ALL
SELECT 
    university_id,
    'PHYS101',
    '物理学基礎',
    '山田次郎',
    '物理学専攻',
    '理学部',
    3,
    '前期',
    2024,
    '必修',
    'ニュートン力学から波動まで、物理学の基本概念を学びます。'
FROM university_data
UNION ALL
SELECT 
    university_id,
    'ECON201',
    'ミクロ経済学',
    '鈴木一郎',
    '経済学専攻',
    '経済学部',
    4,
    '前期',
    2024,
    '必修',
    '消費者理論、企業理論、市場均衡について学習します。'
FROM university_data;