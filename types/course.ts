export interface University {
  id: string
  name: string
  short_name: string
  location?: string
  website?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  university_id: string
  course_code: string
  name: string
  instructor: string
  department?: string
  faculty?: string
  credits: number
  semester?: string
  year?: number
  category?: string
  description?: string
  syllabus_url?: string
  
  // 集計データ
  total_reviews: number
  average_rating: number
  average_difficulty: number
  average_workload: number
  
  created_at: string
  updated_at: string
  
  // リレーション
  university?: University
}

export interface CourseCreateRequest {
  course_code: string
  name: string
  instructor: string
  department?: string
  faculty?: string
  credits: number
  semester?: string
  year?: number
  category?: string
  description?: string
  syllabus_url?: string
}

export interface CourseUpdateRequest extends Partial<CourseCreateRequest> {
  id: string
}

export interface CourseSearchParams {
  search?: string
  department?: string
  faculty?: string
  instructor?: string
  category?: string
  semester?: string
  year?: number
  credits?: number
  min_rating?: number
  max_difficulty?: number
  sort?: CourseSortOption
  page?: number
  limit?: number
}

export type CourseSortOption = 
  | 'name'
  | 'instructor'
  | 'credits'
  | 'average_rating'
  | 'average_difficulty'
  | 'total_reviews'
  | 'created_at'
  | '-name'
  | '-instructor'
  | '-credits' 
  | '-average_rating'
  | '-average_difficulty'
  | '-total_reviews'
  | '-created_at'

export interface CourseListResponse {
  courses: Course[]
  total: number
  page: number
  limit: number
  has_next: boolean
  has_prev: boolean
}

export interface CourseFilter {
  departments: string[]
  faculties: string[]
  categories: string[]
  semesters: string[]
  years: number[]
  credit_ranges: { min: number; max: number }[]
  rating_ranges: { min: number; max: number }[]
  difficulty_ranges: { min: number; max: number }[]
}

export interface CourseStats {
  total_courses: number
  total_reviews: number
  average_rating: number
  most_popular_department: string
  highest_rated_course: Course
  most_reviewed_course: Course
}