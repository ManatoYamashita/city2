import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewCreateSchema, reviewSearchSchema } from '@/lib/validations/review'
import { ReviewListResponse, ReviewSearchParams } from '@/types/review'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // 検索パラメータの解析とバリデーション
    const params: ReviewSearchParams = {
      course_id: searchParams.get('course_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
      max_rating: searchParams.get('max_rating') ? parseFloat(searchParams.get('max_rating')!) : undefined,
      min_difficulty: searchParams.get('min_difficulty') ? parseFloat(searchParams.get('min_difficulty')!) : undefined,
      max_difficulty: searchParams.get('max_difficulty') ? parseFloat(searchParams.get('max_difficulty')!) : undefined,
      assignment_frequency: searchParams.get('assignment_frequency') as any || undefined,
      grading_criteria: searchParams.get('grading_criteria') as any || undefined,
      attendance_required: searchParams.get('attendance_required') ? searchParams.get('attendance_required') === 'true' : undefined,
      sort: searchParams.get('sort') as any || '-created_at',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    // バリデーション
    const validatedParams = reviewSearchSchema.parse(params)
    
    // クエリ構築
    let query = supabase
      .from('reviews')
      .select(`
        *,
        course:courses(id, name, instructor, course_code),
        user:profiles(id, display_name, grade, department)
      `)

    // 検索条件の適用
    if (validatedParams.course_id) {
      query = query.eq('course_id', validatedParams.course_id)
    }

    if (validatedParams.user_id) {
      query = query.eq('user_id', validatedParams.user_id)
    }

    if (validatedParams.min_rating) {
      query = query.gte('overall_rating', validatedParams.min_rating)
    }

    if (validatedParams.max_rating) {
      query = query.lte('overall_rating', validatedParams.max_rating)
    }

    if (validatedParams.min_difficulty) {
      query = query.gte('difficulty', validatedParams.min_difficulty)
    }

    if (validatedParams.max_difficulty) {
      query = query.lte('difficulty', validatedParams.max_difficulty)
    }

    if (validatedParams.assignment_frequency) {
      query = query.eq('assignment_frequency', validatedParams.assignment_frequency)
    }

    if (validatedParams.grading_criteria) {
      query = query.eq('grading_criteria', validatedParams.grading_criteria)
    }

    if (validatedParams.attendance_required !== undefined) {
      query = query.eq('attendance_required', validatedParams.attendance_required)
    }

    // ソート
    const sortField = validatedParams.sort?.startsWith('-') 
      ? validatedParams.sort.substring(1) 
      : validatedParams.sort || 'created_at'
    const sortOrder = validatedParams.sort?.startsWith('-') ? false : true
    
    query = query.order(sortField, { ascending: sortOrder })

    // ページネーション
    const from = (validatedParams.page! - 1) * validatedParams.limit!
    const to = from + validatedParams.limit! - 1

    query = query.range(from, to)

    // クエリ実行
    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Review search error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews', details: error.message },
        { status: 500 }
      )
    }

    // レスポンス構築
    const response: ReviewListResponse = {
      reviews: reviews || [],
      total: count || 0,
      page: validatedParams.page!,
      limit: validatedParams.limit!,
      has_next: (count || 0) > validatedParams.page! * validatedParams.limit!,
      has_prev: validatedParams.page! > 1,
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json()
    const validatedData = reviewCreateSchema.parse(body)

    // コース存在確認
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', validatedData.course_id)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 既存レビュー確認（1授業に1レビューのみ）
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('course_id', validatedData.course_id)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this course' },
        { status: 400 }
      )
    }

    // ユーザープロフィール取得（匿名化用）
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, department')
      .eq('id', user.id)
      .single()

    // レビュー作成
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        ...validatedData,
        user_id: user.id,
        anonymous_grade: profile?.grade,
        anonymous_department: profile?.department,
      })
      .select(`
        *,
        course:courses(id, name, instructor, course_code),
        user:profiles(id, display_name, grade, department)
      `)
      .single()

    if (error) {
      console.error('Review creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create review', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(review, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}