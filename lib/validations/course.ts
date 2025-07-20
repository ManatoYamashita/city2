import { z } from 'zod'

export const courseCreateSchema = z.object({
  course_code: z.string().min(1, '科目コードは必須です').max(50, '科目コードは50文字以内で入力してください'),
  name: z.string().min(1, '科目名は必須です').max(255, '科目名は255文字以内で入力してください'),
  instructor: z.string().min(1, '教員名は必須です').max(255, '教員名は255文字以内で入力してください'),
  department: z.string().max(100, '学科名は100文字以内で入力してください').optional(),
  faculty: z.string().max(100, '学部名は100文字以内で入力してください').optional(),
  credits: z.number().min(1, '単位数は1以上で入力してください').max(10, '単位数は10以下で入力してください'),
  semester: z.enum(['前期', '後期', '通年', '集中']).optional(),
  year: z.number().min(2020, '年度は2020年以降で入力してください').max(2030, '年度は2030年以下で入力してください').optional(),
  category: z.enum(['必修', '選択', '自由']).optional(),
  description: z.string().max(1000, '授業概要は1000文字以内で入力してください').optional(),
  syllabus_url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
})

export const courseUpdateSchema = courseCreateSchema.partial().extend({
  id: z.string().uuid('有効なIDを指定してください'),
})

export const courseSearchSchema = z.object({
  search: z.string().max(255, '検索キーワードは255文字以内で入力してください').optional(),
  department: z.string().max(100, '学科名は100文字以内で入力してください').optional(),
  faculty: z.string().max(100, '学部名は100文字以内で入力してください').optional(),
  instructor: z.string().max(255, '教員名は255文字以内で入力してください').optional(),
  category: z.enum(['必修', '選択', '自由']).optional(),
  semester: z.enum(['前期', '後期', '通年', '集中']).optional(),
  year: z.number().min(2020).max(2030).optional(),
  credits: z.number().min(1).max(10).optional(),
  min_rating: z.number().min(1).max(5).optional(),
  max_difficulty: z.number().min(1).max(5).optional(),
  sort: z.enum([
    'name', 'instructor', 'credits', 'average_rating', 'average_difficulty', 'total_reviews', 'created_at',
    '-name', '-instructor', '-credits', '-average_rating', '-average_difficulty', '-total_reviews', '-created_at'
  ]).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

export const courseFilterSchema = z.object({
  departments: z.array(z.string()).optional(),
  faculties: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  semesters: z.array(z.string()).optional(),
  years: z.array(z.number()).optional(),
  credit_ranges: z.array(z.object({
    min: z.number(),
    max: z.number(),
  })).optional(),
  rating_ranges: z.array(z.object({
    min: z.number().min(1).max(5),
    max: z.number().min(1).max(5),
  })).optional(),
  difficulty_ranges: z.array(z.object({
    min: z.number().min(1).max(5),
    max: z.number().min(1).max(5),
  })).optional(),
})

// 型推論用
export type CourseCreateFormData = z.infer<typeof courseCreateSchema>
export type CourseUpdateFormData = z.infer<typeof courseUpdateSchema>
export type CourseSearchFormData = z.infer<typeof courseSearchSchema>
export type CourseFilterFormData = z.infer<typeof courseFilterSchema>