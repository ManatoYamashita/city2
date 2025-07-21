'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Subscription } from '@/types/stripe'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  isPremium: boolean
  refresh: () => Promise<void>
  createSubscription: (priceId: string, options?: { trialDays?: number }) => Promise<any>
  cancelSubscription: (immediately?: boolean) => Promise<void>
  openCustomerPortal: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // サブスクリプション情報を取得
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSubscription(null)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due', 'canceled'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      setSubscription(data || null)
    } catch (err) {
      console.error('Failed to fetch subscription:', err)
      setError(err instanceof Error ? err.message : 'サブスクリプション情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // 初回読み込み
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // プレミアムユーザーかどうかを判定
  const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing'

  // サブスクリプションを作成
  const createSubscription = useCallback(async (
    priceId: string, 
    options?: { trialDays?: number }
  ) => {
    try {
      setError(null)

      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          trial_days: options?.trialDays,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'サブスクリプションの作成に失敗しました')
      }

      const result = await response.json()
      
      // データを更新
      await fetchSubscription()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サブスクリプションの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [fetchSubscription])

  // サブスクリプションをキャンセル
  const cancelSubscription = useCallback(async (immediately = false) => {
    if (!subscription) {
      throw new Error('キャンセルするサブスクリプションが見つかりません')
    }

    try {
      setError(null)

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.stripe_subscription_id,
          immediately,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'サブスクリプションのキャンセルに失敗しました')
      }

      // データを更新
      await fetchSubscription()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サブスクリプションのキャンセルに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [subscription, fetchSubscription])

  // 顧客ポータルを開く
  const openCustomerPortal = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_url: window.location.href,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '顧客ポータルの作成に失敗しました')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '顧客ポータルの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  return {
    subscription,
    loading,
    error,
    isPremium,
    refresh: fetchSubscription,
    createSubscription,
    cancelSubscription,
    openCustomerPortal,
  }
}