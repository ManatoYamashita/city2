import { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  university_id?: string
  display_name?: string
  student_id?: string
  admission_year?: number
  department?: string
  faculty?: string
  avatar_url?: string
  is_premium: boolean
  premium_expires_at?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: Profile
}

export interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, userData?: Partial<Profile>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshUser: () => Promise<void>
}

export interface SignUpData {
  email: string
  password: string
  displayName?: string
  admission_year?: number
  department?: string
  faculty?: string
}