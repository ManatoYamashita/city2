import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { courseUpdateSchema } from '@/lib/validations/course'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // コース詳細の取得
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        university:universities(id, name, short_name, location)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      console.error('Course fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(course)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
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
    const validatedData = courseUpdateSchema.parse({ ...body, id })

    // コース存在確認
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // idを除外してアップデート
    const { id: _, ...updateData } = validatedData

    // コース更新
    const { data: course, error } = await supabase
      .from('courses')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        university:universities(id, name, short_name, location)
      `)
      .single()

    if (error) {
      console.error('Course update error:', error)
      return NextResponse.json(
        { error: 'Failed to update course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(course)

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
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

    // コース存在確認
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // 関連レビューの確認
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact' })
      .eq('course_id', id)

    if (reviewCount && reviewCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing reviews' },
        { status: 400 }
      )
    }

    // コース削除
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Course deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete course', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Course deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}