'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { AuthContextType, Profile, SignUpData } from '@/types/auth'
import { authHelpers, AuthError } from './helpers'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await authHelpers.getUserProfile(userId)
      setProfile(userProfile)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, userData?: Partial<Profile>) => {
    setLoading(true)
    try {
      const signUpData: SignUpData = {
        email,
        password,
        displayName: userData?.display_name,
        grade: userData?.grade,
        department: userData?.department,
        faculty: userData?.faculty,
      }
      
      await authHelpers.signUp(signUpData)
      // User will be set via onAuthStateChange
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await authHelpers.signIn(email, password)
      // User will be set via onAuthStateChange
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authHelpers.signOut()
      // User will be cleared via onAuthStateChange
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await authHelpers.resetPassword(email)
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new AuthError('User not authenticated')
    }

    try {
      const updatedProfile = await authHelpers.updateUserProfile(user.id, updates)
      setProfile(updatedProfile)
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    if (!user) return
    
    try {
      await loadUserProfile(user.id)
    } catch (error) {
      console.error('Refresh user error:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}