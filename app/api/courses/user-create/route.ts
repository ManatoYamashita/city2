import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { courseCreateSchema } from '@/lib/validations/course'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 認証チェック（管理者チェックは不要）
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
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

    // 重複チェック：同じ大学、科目コード、年度、学期の組み合わせをチェック
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id, name, instructor')
      .eq('university_id', university.id)
      .eq('course_code', validatedData.course_code)
      .eq('year', validatedData.year || new Date().getFullYear())
      .eq('semester', validatedData.semester || '前期')
      .single()

    if (existingCourse) {
      return NextResponse.json({
        error: 'この授業は既に登録されています',
        existing_course: {
          name: existingCourse.name,
          instructor: existingCourse.instructor
        }
      }, { status: 409 })
    }

    // confirm_overrideフラグをチェック
    const confirmOverride = body.confirm_override || false

    // 類似授業チェック：confirm_overrideがfalseの場合のみ実行
    if (!confirmOverride) {
      const { data: similarCourses } = await supabase
        .from('courses')
        .select('id, name, instructor, course_code, year, semester')
        .eq('university_id', university.id)
        .eq('name', validatedData.name)
        .eq('instructor', validatedData.instructor)
        .limit(3)

      if (similarCourses && similarCourses.length > 0) {
        return NextResponse.json({
          error: '類似の授業が既に存在します。本当に新しい授業として登録しますか？',
          similar_courses: similarCourses,
          confirm_required: true
        }, { status: 409 })
      }
    }

    // コース作成
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...validatedData,
        university_id: university.id,
        year: validatedData.year || new Date().getFullYear(), // デフォルトは今年度
      })
      .select(`
        *,
        university:universities(id, name, short_name)
      `)
      .single()

    if (error) {
      console.error('Course creation error:', error)
      
      // データベース制約エラーのハンドリング
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: 'この授業は既に登録されています（重複）' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: '授業の登録に失敗しました', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '授業が正常に登録されました',
      course
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '入力データが正しくありません', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 重複チェック用の専用エンドポイント
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const course_code = searchParams.get('course_code')
    const name = searchParams.get('name')
    const instructor = searchParams.get('instructor')
    const year = searchParams.get('year')
    const semester = searchParams.get('semester')

    if (!course_code && !name) {
      return NextResponse.json({ error: '検索条件が不足しています' }, { status: 400 })
    }

    // 大学IDの取得
    const { data: university } = await supabase
      .from('universities')
      .select('id')
      .limit(1)
      .single()

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 400 })
    }

    let query = supabase
      .from('courses')
      .select('id, name, instructor, course_code, year, semester, department, faculty, credits')
      .eq('university_id', university.id)

    // 検索条件の適用
    if (course_code) {
      query = query.eq('course_code', course_code)
    }
    
    if (name) {
      query = query.ilike('name', `%${name}%`)
    }
    
    if (instructor) {
      query = query.ilike('instructor', `%${instructor}%`)
    }
    
    if (year) {
      query = query.eq('year', parseInt(year))
    }
    
    if (semester) {
      query = query.eq('semester', semester)
    }

    const { data: courses, error } = await query.limit(10)

    if (error) {
      console.error('Duplicate check error:', error)
      return NextResponse.json(
        { error: '重複チェックに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      found: courses && courses.length > 0,
      courses: courses || [],
      count: courses?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}