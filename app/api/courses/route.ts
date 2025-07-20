import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { courseCreateSchema, courseSearchSchema } from '@/lib/validations/course'
import { Course, CourseListResponse, CourseSearchParams } from '@/types/course'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // 検索パラメータの解析とバリデーション
    const params: CourseSearchParams = {
      search: searchParams.get('search') || undefined,
      department: searchParams.get('department') || undefined,
      faculty: searchParams.get('faculty') || undefined,
      instructor: searchParams.get('instructor') || undefined,
      category: searchParams.get('category') || undefined,
      semester: searchParams.get('semester') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      credits: searchParams.get('credits') ? parseInt(searchParams.get('credits')!) : undefined,
      min_rating: searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : undefined,
      max_difficulty: searchParams.get('max_difficulty') ? parseFloat(searchParams.get('max_difficulty')!) : undefined,
      sort: searchParams.get('sort') as any || 'name',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    // バリデーション
    const validatedParams = courseSearchSchema.parse(params)
    
    // クエリ構築
    let query = supabase
      .from('courses')
      .select(`
        *,
        university:universities(id, name, short_name)
      `)

    // 検索条件の適用
    if (validatedParams.search) {
      query = query.or(`name.ilike.%${validatedParams.search}%,instructor.ilike.%${validatedParams.search}%,course_code.ilike.%${validatedParams.search}%`)
    }

    if (validatedParams.department) {
      query = query.eq('department', validatedParams.department)
    }

    if (validatedParams.faculty) {
      query = query.eq('faculty', validatedParams.faculty)
    }

    if (validatedParams.instructor) {
      query = query.ilike('instructor', `%${validatedParams.instructor}%`)
    }

    if (validatedParams.category) {
      query = query.eq('category', validatedParams.category)
    }

    if (validatedParams.semester) {
      query = query.eq('semester', validatedParams.semester)
    }

    if (validatedParams.year) {
      query = query.eq('year', validatedParams.year)
    }

    if (validatedParams.credits) {
      query = query.eq('credits', validatedParams.credits)
    }

    if (validatedParams.min_rating) {
      query = query.gte('average_rating', validatedParams.min_rating)
    }

    if (validatedParams.max_difficulty) {
      query = query.lte('average_difficulty', validatedParams.max_difficulty)
    }

    // ソート
    const sortField = validatedParams.sort?.startsWith('-') 
      ? validatedParams.sort.substring(1) 
      : validatedParams.sort || 'name'
    const sortOrder = validatedParams.sort?.startsWith('-') ? false : true
    
    query = query.order(sortField, { ascending: sortOrder })

    // ページネーション
    const from = (validatedParams.page! - 1) * validatedParams.limit!
    const to = from + validatedParams.limit! - 1

    query = query.range(from, to)

    // クエリ実行
    const { data: courses, error, count } = await query

    if (error) {
      console.error('Course search error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: error.message },
        { status: 500 }
      )
    }

    // レスポンス構築
    const response: CourseListResponse = {
      courses: courses || [],
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

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json()
    const validatedData = courseCreateSchema.parse(body)

    // 大学IDの取得（現在は固定値、将来的には動的に）
    const { data: university } = await supabase
      .from('universities')
      .select('id')
      .limit(1)
      .single()

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 400 })
    }

    // コース作成
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...validatedData,
        university_id: university.id,
      })
      .select(`
        *,
        university:universities(id, name, short_name)
      `)
      .single()

    if (error) {
      console.error('Course creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(course, { status: 201 })

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