import { z } from 'zod'

export const reviewCreateSchema = z.object({
  course_id: z.string().uuid('有効な授業IDを指定してください'),
  overall_rating: z.number().min(1, '総合評価は1-5で入力してください').max(5, '総合評価は1-5で入力してください'),
  difficulty: z.number().min(1, '難易度は1-5で入力してください').max(5, '難易度は1-5で入力してください'),
  workload: z.number().min(1, '課題量は1-5で入力してください').max(5, '課題量は1-5で入力してください'),
  title: z.string().max(200, 'タイトルは200文字以内で入力してください').optional(),
  content: z.string().min(10, 'レビュー内容は10文字以上で入力してください').max(2000, 'レビュー内容は2000文字以内で入力してください'),
  pros: z.string().max(1000, '良い点は1000文字以内で入力してください').optional(),
  cons: z.string().max(1000, '悪い点は1000文字以内で入力してください').optional(),
  advice: z.string().max(1000, 'アドバイスは1000文字以内で入力してください').optional(),
  attendance_required: z.boolean().optional(),
  test_difficulty: z.number().min(1).max(5).optional(),
  assignment_frequency: z.enum(['none', 'light', 'moderate', 'heavy', 'very_heavy']).optional(),
  grading_criteria: z.enum(['lenient', 'fair', 'strict']).optional(),
})

export const reviewUpdateSchema = reviewCreateSchema.partial().extend({
  id: z.string().uuid('有効なレビューIDを指定してください'),
}).omit({ course_id: true })

export const reviewSearchSchema = z.object({
  course_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  min_rating: z.number().min(1).max(5).optional(),
  max_rating: z.number().min(1).max(5).optional(),
  min_difficulty: z.number().min(1).max(5).optional(),
  max_difficulty: z.number().min(1).max(5).optional(),
  assignment_frequency: z.enum(['none', 'light', 'moderate', 'heavy', 'very_heavy']).optional(),
  grading_criteria: z.enum(['lenient', 'fair', 'strict']).optional(),
  attendance_required: z.boolean().optional(),
  sort: z.enum([
    'created_at', 'updated_at', 'overall_rating', 'difficulty', 'workload', 'helpful_count',
    '-created_at', '-updated_at', '-overall_rating', '-difficulty', '-workload', '-helpful_count'
  ]).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

export const reviewVoteSchema = z.object({
  review_id: z.string().uuid('有効なレビューIDを指定してください'),
  is_helpful: z.boolean(),
})

// レビューフォーム用の詳細スキーマ
export const reviewFormSchema = z.object({
  overall_rating: z.number().min(1).max(5),
  difficulty: z.number().min(1).max(5),
  workload: z.number().min(1).max(5),
  title: z.string().min(1, 'タイトルを入力してください').max(200),
  content: z.string().min(10, 'レビュー内容は10文字以上で入力してください').max(2000),
  pros: z.string().max(1000).optional(),
  cons: z.string().max(1000).optional(),
  advice: z.string().max(1000).optional(),
  attendance_required: z.boolean(),
  test_difficulty: z.number().min(1).max(5),
  assignment_frequency: z.enum(['none', 'light', 'moderate', 'heavy', 'very_heavy']),
  grading_criteria: z.enum(['lenient', 'fair', 'strict']),
}).refine((data) => {
  // 内容のバリデーション: pros, cons, advice のいずれかは入力必須
  return data.pros || data.cons || data.advice
}, {
  message: '良い点、悪い点、アドバイスのいずれかは入力してください',
  path: ['pros']
})

// 型推論用
export type ReviewCreateFormData = z.infer<typeof reviewCreateSchema>
export type ReviewUpdateFormData = z.infer<typeof reviewUpdateSchema>
export type ReviewSearchFormData = z.infer<typeof reviewSearchSchema>
export type ReviewVoteFormData = z.infer<typeof reviewVoteSchema>
export type ReviewFormData = z.infer<typeof reviewFormSchema>

// 定数
export const ASSIGNMENT_FREQUENCY_LABELS = {
  none: 'なし',
  light: '少ない',
  moderate: '普通',
  heavy: '多い',
  very_heavy: '非常に多い',
} as const

export const GRADING_CRITERIA_LABELS = {
  lenient: '甘い',
  fair: '普通',
  strict: '厳しい',
} as const

export const RATING_LABELS = {
  1: '非常に悪い',
  2: '悪い',
  3: '普通',
  4: '良い',
  5: '非常に良い',
} as const

export const DIFFICULTY_LABELS = {
  1: '非常に易しい',
  2: '易しい',
  3: '普通',
  4: '難しい',
  5: '非常に難しい',
} as const

export const WORKLOAD_LABELS = {
  1: '非常に軽い',
  2: '軽い',
  3: '普通',
  4: '重い',
  5: '非常に重い',
} as const