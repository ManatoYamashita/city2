import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewUpdateSchema } from '@/lib/validations/review'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // レビュー詳細の取得
    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        course:courses(id, name, instructor, course_code, department, faculty),
        user:profiles(id, display_name, grade, department)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }
      console.error('Review fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch review', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(review)

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

    // レビュー存在確認と権限チェック
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, user_id, created_at')
      .eq('id', id)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false
    const isOwner = existingReview.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // 24時間編集制限チェック（管理者は除外）
    if (!isAdmin && isOwner) {
      const createdAt = new Date(existingReview.created_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        return NextResponse.json(
          { error: 'Review can only be edited within 24 hours of creation' },
          { status: 400 }
        )
      }
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json()
    const validatedData = reviewUpdateSchema.parse({ ...body, id })

    // idを除外してアップデート
    const { id: _, ...updateData } = validatedData

    // レビュー更新
    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        course:courses(id, name, instructor, course_code, department, faculty),
        user:profiles(id, display_name, grade, department)
      `)
      .single()

    if (error) {
      console.error('Review update error:', error)
      return NextResponse.json(
        { error: 'Failed to update review', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(review)

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

    // レビュー存在確認と権限チェック
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, user_id, course_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin || false
    const isOwner = existingReview.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // レビュー削除
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Review deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete review', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Review deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}