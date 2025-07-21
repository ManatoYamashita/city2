import { createClient } from '@/lib/supabase/server'
import { AdminUser } from '@/types/admin'

export class AdminAuthError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AdminAuthError'
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return null
    }

    // 管理者テーブルから情報を取得
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminData) {
      return null
    }

    return {
      id: adminData.id,
      email: user.email || '',
      role: adminData.role,
      name: adminData.name,
      created_at: adminData.created_at,
      updated_at: adminData.updated_at,
      last_login: adminData.last_login,
      is_active: adminData.is_active,
    }
  } catch (error) {
    console.error('Failed to get admin user:', error)
    return null
  }
}

export async function requireAdminAuth(
  requiredRole?: AdminUser['role']
): Promise<AdminUser> {
  const adminUser = await getAdminUser()

  if (!adminUser) {
    throw new AdminAuthError('管理者認証が必要です', 'ADMIN_AUTH_REQUIRED')
  }

  if (requiredRole && !hasPermission(adminUser.role, requiredRole)) {
    throw new AdminAuthError('十分な権限がありません', 'INSUFFICIENT_PERMISSIONS')
  }

  // 最終ログイン時刻を更新
  try {
    const supabase = await createClient()
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id)
  } catch (error) {
    console.error('Failed to update last login:', error)
  }

  return adminUser
}

export function hasPermission(
  userRole: AdminUser['role'],
  requiredRole: AdminUser['role']
): boolean {
  const roleHierarchy = {
    'moderator': 1,
    'admin': 2,
    'super_admin': 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: 'user' | 'course' | 'review' | 'subscription' | 'system',
  targetId: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('id', adminId)
      .single()

    if (!adminUser) return

    const { data: user } = await supabase.auth.admin.getUserById(adminUser.user_id)
    
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_id: adminId,
        admin_email: user.user?.email || '',
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

// 管理者専用のSupabaseクライアント作成関数
export async function createAdminClient() {
  const adminUser = await requireAdminAuth()
  const supabase = await createClient()
  
  return {
    supabase,
    adminUser,
  }
}

// 管理者権限チェック用のヘルパー関数
export const adminPermissions = {
  canManageUsers: (role: AdminUser['role']) => hasPermission(role, 'admin'),
  canManagePayments: (role: AdminUser['role']) => hasPermission(role, 'admin'),
  canManageCourses: (role: AdminUser['role']) => hasPermission(role, 'moderator'),
  canManageReviews: (role: AdminUser['role']) => hasPermission(role, 'moderator'),
  canViewAnalytics: (role: AdminUser['role']) => hasPermission(role, 'moderator'),
  canManageSystem: (role: AdminUser['role']) => hasPermission(role, 'super_admin'),
  canManageAdmins: (role: AdminUser['role']) => hasPermission(role, 'super_admin'),
}

export default {
  getAdminUser,
  requireAdminAuth,
  hasPermission,
  logAdminAction,
  createAdminClient,
  adminPermissions,
}