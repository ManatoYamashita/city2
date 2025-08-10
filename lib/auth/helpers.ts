import { createClient } from '@/lib/supabase/client'
import { Profile, SignUpData } from '@/types/auth'

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export const authHelpers = {
  // Sign up with email and password
  async signUp(data: SignUpData) {
    const supabase = createClient()
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          display_name: data.displayName,
          admission_year: data.admission_year,
          department: data.department,
          faculty: data.faculty,
        }
      }
    })

    if (authError) {
      throw new AuthError(authError.message, authError.message)
    }

    return authData
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new AuthError(error.message, error.message)
    }

    return data
  },

  // Sign out
  async signOut() {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new AuthError(error.message, error.message)
    }
  },

  // Get current user
  async getCurrentUser() {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new AuthError(error.message, error.message)
    }

    return user
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<Profile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // 他のHTTP/DBエラーはそのまま上位に伝搬
      throw new AuthError(error.message, error.code)
    }

    // プロファイルが未作成の場合は即時生成して返す
    if (!data) {
      // ユーザメタから初期値を補完
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const displayName = (user?.user_metadata as any)?.display_name as string | undefined

      const { data: created, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            display_name: displayName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (upsertError) {
        // 競合などで取得できない場合はnullで返す（以降のUIは空表示で動作）
        return null
      }

      return created as Profile
    }

    return data
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<Profile>) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new AuthError(error.message, error.code)
    }

    return data
  },

  // Check if user is premium
  async isPremiumUser(userId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, premium_expires_at')
      .eq('id', userId)
      .single()

    if (error) {
      return false
    }

    if (!data.is_premium) {
      return false
    }

    if (data.premium_expires_at) {
      return new Date(data.premium_expires_at) > new Date()
    }

    return true
  },

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      return false
    }

    return data.is_admin || false
  }
}