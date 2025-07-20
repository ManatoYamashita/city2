import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewVoteSchema } from '@/lib/validations/review'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: reviewId } = await params
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json()
    const validatedData = reviewVoteSchema.parse({
      ...body,
      review_id: reviewId,
    })

    // レビュー存在確認
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, user_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // 自分のレビューには投票できない
    if (review.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own review' },
        { status: 400 }
      )
    }

    // 既存の投票確認
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('id, is_helpful')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (existingVote) {
      // 既存の投票がある場合
      if (existingVote.is_helpful === validatedData.is_helpful) {
        // 同じ投票の場合は削除（取り消し）
        const { error: deleteError } = await supabase
          .from('review_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          console.error('Vote deletion error:', deleteError)
          return NextResponse.json(
            { error: 'Failed to remove vote', details: deleteError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          message: 'Vote removed successfully',
          action: 'removed'
        })
      } else {
        // 異なる投票の場合は更新
        const { data: updatedVote, error: updateError } = await supabase
          .from('review_votes')
          .update({
            is_helpful: validatedData.is_helpful,
          })
          .eq('id', existingVote.id)
          .select()
          .single()

        if (updateError) {
          console.error('Vote update error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update vote', details: updateError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({
          vote: updatedVote,
          message: 'Vote updated successfully',
          action: 'updated'
        })
      }
    } else {
      // 新しい投票を作成
      const { data: newVote, error: createError } = await supabase
        .from('review_votes')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: validatedData.is_helpful,
        })
        .select()
        .single()

      if (createError) {
        console.error('Vote creation error:', createError)
        return NextResponse.json(
          { error: 'Failed to create vote', details: createError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        vote: newVote,
        message: 'Vote created successfully',
        action: 'created'
      }, { status: 201 })
    }

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id: reviewId } = await params
    
    // 認証チェック（オプション）
    const { data: { user } } = await supabase.auth.getUser()

    // 投票統計の取得
    const { data: voteStats, error: statsError } = await supabase
      .from('review_votes')
      .select('is_helpful')
      .eq('review_id', reviewId)

    if (statsError) {
      console.error('Vote stats error:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch vote stats', details: statsError.message },
        { status: 500 }
      )
    }

    const helpfulCount = voteStats?.filter(vote => vote.is_helpful).length || 0
    const unhelpfulCount = voteStats?.filter(vote => !vote.is_helpful).length || 0
    const totalVotes = voteStats?.length || 0

    // ユーザーの投票状況（ログイン済みの場合）
    let userVote = null
    if (user) {
      const { data: userVoteData } = await supabase
        .from('review_votes')
        .select('is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single()

      userVote = userVoteData
    }

    return NextResponse.json({
      review_id: reviewId,
      helpful_count: helpfulCount,
      unhelpful_count: unhelpfulCount,
      total_votes: totalVotes,
      user_vote: userVote,
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}