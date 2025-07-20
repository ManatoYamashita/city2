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
          grade: data.grade,
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
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found
        return null
      }
      throw new AuthError(error.message, error.code)
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