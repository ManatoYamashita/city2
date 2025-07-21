import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdminAuth, logAdminAction } from '@/lib/auth/admin'
import { UserManagementData, UserFilters } from '@/types/admin'

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック（admin以上が必要）
    const adminUser = await requireAdminAuth('admin')
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as UserFilters['status']
    const isPremium = searchParams.get('is_premium')
    const registrationDateFrom = searchParams.get('registration_date_from')
    const registrationDateTo = searchParams.get('registration_date_to')

    // クエリビルダーを作成
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        updated_at,
        last_sign_in_at
      `)

    // 検索条件を適用
    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    if (registrationDateFrom) {
      query = query.gte('created_at', registrationDateFrom)
    }

    if (registrationDateTo) {
      query = query.lte('created_at', registrationDateTo)
    }

    // ページネーション
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: users, error: usersError, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (usersError) {
      throw usersError
    }

    // 各ユーザーの詳細情報を並行取得
    const usersWithDetails = await Promise.all(
      (users || []).map(async (user: any) => {
        const [
          { data: userStatus },
          { data: subscription },
          { count: reviewCount },
          { data: billingHistory }
        ] = await Promise.all([
          supabase
            .from('user_status')
            .select('status')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('subscriptions')
            .select('status, price_id')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .single(),
          supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('billing_history')
            .select('amount')
            .eq('user_id', user.id)
            .eq('status', 'paid')
        ])

        const totalSpent = billingHistory?.reduce((sum: number, b: any) => sum + b.amount, 0) || 0
        const isPremiumUser = subscription?.status === 'active' || subscription?.status === 'trialing'

        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          is_premium: isPremiumUser,
          subscription_status: subscription?.status,
          review_count: reviewCount || 0,
          course_count: 0, // TODO: 履修した授業数を計算
          total_spent: totalSpent,
          status: userStatus?.status || 'active',
        } as UserManagementData
      })
    )

    // フィルターを適用
    let filteredUsers = usersWithDetails

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status)
    }

    if (isPremium !== null) {
      const premiumFilter = isPremium === 'true'
      filteredUsers = filteredUsers.filter(user => user.is_premium === premiumFilter)
    }

    return NextResponse.json({
      users: filteredUsers,
      total_count: count || 0,
      page,
      page_size: pageSize,
      filters_applied: {
        search,
        status,
        is_premium: isPremium,
        registration_date_from: registrationDateFrom,
        registration_date_to: registrationDateTo,
      },
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'ユーザーデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}