export interface Review {
  id: string
  course_id: string
  user_id: string
  
  // 評価項目（1-5の5段階評価）
  overall_rating: number
  difficulty: number
  workload: number
  
  // テキストレビュー
  title?: string
  content: string
  pros?: string
  cons?: string
  advice?: string
  
  // 匿名化情報
  anonymous_grade?: number
  anonymous_department?: string
  
  // メタデータ
  attendance_required?: boolean
  test_difficulty?: number
  assignment_frequency?: 'none' | 'light' | 'moderate' | 'heavy' | 'very_heavy'
  grading_criteria?: 'lenient' | 'fair' | 'strict'
  
  // 管理・モデレーション
  is_verified: boolean
  is_reported: boolean
  report_count: number
  helpful_count: number
  
  created_at: string
  updated_at: string
  
  // リレーション
  course?: {
    id: string
    name: string
    instructor: string
    course_code: string
  }
  user?: {
    id: string
    display_name?: string
    grade?: number
    department?: string
  }
}

export interface ReviewCreateRequest {
  course_id: string
  overall_rating: number
  difficulty: number
  workload: number
  title?: string
  content: string
  pros?: string
  cons?: string
  advice?: string
  attendance_required?: boolean
  test_difficulty?: number
  assignment_frequency?: 'none' | 'light' | 'moderate' | 'heavy' | 'very_heavy'
  grading_criteria?: 'lenient' | 'fair' | 'strict'
}

export interface ReviewUpdateRequest {
  id: string
  overall_rating?: number
  difficulty?: number
  workload?: number
  title?: string
  content?: string
  pros?: string
  cons?: string
  advice?: string
  attendance_required?: boolean
  test_difficulty?: number
  assignment_frequency?: 'none' | 'light' | 'moderate' | 'heavy' | 'very_heavy'
  grading_criteria?: 'lenient' | 'fair' | 'strict'
}

export interface ReviewSearchParams {
  course_id?: string
  user_id?: string
  min_rating?: number
  max_rating?: number
  min_difficulty?: number
  max_difficulty?: number
  assignment_frequency?: string
  grading_criteria?: string
  attendance_required?: boolean
  sort?: ReviewSortOption
  page?: number
  limit?: number
}

export type ReviewSortOption = 
  | 'created_at'
  | 'updated_at'
  | 'overall_rating'
  | 'difficulty'
  | 'workload'
  | 'helpful_count'
  | '-created_at'
  | '-updated_at'
  | '-overall_rating'
  | '-difficulty'
  | '-workload'
  | '-helpful_count'

export interface ReviewListResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  has_next: boolean
  has_prev: boolean
}

export interface ReviewVote {
  id: string
  review_id: string
  user_id: string
  is_helpful: boolean
  created_at: string
}

export interface ReviewVoteRequest {
  review_id: string
  is_helpful: boolean
}

export interface ReviewStats {
  total_reviews: number
  average_overall_rating: number
  average_difficulty: number
  average_workload: number
  rating_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  difficulty_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  workload_distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  attendance_required_percentage: number
  assignment_frequency_distribution: {
    none: number
    light: number
    moderate: number
    heavy: number
    very_heavy: number
  }
  grading_criteria_distribution: {
    lenient: number
    fair: number
    strict: number
  }
}

export interface ReviewFormData {
  overall_rating: number
  difficulty: number
  workload: number
  title: string
  content: string
  pros: string
  cons: string
  advice: string
  attendance_required: boolean
  test_difficulty: number
  assignment_frequency: 'none' | 'light' | 'moderate' | 'heavy' | 'very_heavy'
  grading_criteria: 'lenient' | 'fair' | 'strict'
}