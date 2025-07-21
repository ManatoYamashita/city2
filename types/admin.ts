export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  name?: string
  created_at: string
  updated_at: string
  last_login?: string
  is_active: boolean
}

export interface AdminDashboardStats {
  users: {
    total: number
    new_this_month: number
    premium_users: number
    active_last_30_days: number
  }
  courses: {
    total: number
    new_this_month: number
    most_reviewed: Array<{
      id: string
      title: string
      review_count: number
      average_rating: number
    }>
  }
  reviews: {
    total: number
    new_this_month: number
    average_rating: number
    by_month: Array<{
      month: string
      count: number
      average_rating: number
    }>
  }
  revenue: {
    total_this_month: number
    total_all_time: number
    subscription_count: number
    churn_rate: number
    by_month: Array<{
      month: string
      revenue: number
      subscriptions: number
    }>
  }
}

export interface UserManagementData {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  is_premium: boolean
  subscription_status?: string
  review_count: number
  course_count: number
  total_spent: number
  status: 'active' | 'suspended' | 'deleted'
}

export interface PaymentManagementData {
  id: string
  user_email: string
  subscription_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan_name: string
  amount: number
  currency: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

export interface CourseManagementData {
  id: string
  title: string
  instructor: string
  department: string
  credits: number
  semester: string
  year: string
  review_count: number
  average_rating: number
  created_at: string
  updated_at: string
  status: 'active' | 'archived' | 'pending_review'
}

export interface ReviewModerationData {
  id: string
  course_title: string
  user_email: string
  rating: number
  content: string
  created_at: string
  updated_at: string
  status: 'approved' | 'pending' | 'rejected' | 'flagged'
  report_count: number
  moderator_notes?: string
}

export interface AdminActionLog {
  id: string
  admin_id: string
  admin_email: string
  action: string
  target_type: 'user' | 'course' | 'review' | 'subscription' | 'system'
  target_id: string
  details: Record<string, unknown>
  created_at: string
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error'
    response_time: number
    connections: number
  }
  stripe: {
    status: 'healthy' | 'warning' | 'error'
    webhook_status: 'operational' | 'degraded' | 'down'
    last_webhook: string
  }
  storage: {
    status: 'healthy' | 'warning' | 'error'
    usage_percentage: number
    available_space: string
  }
  performance: {
    avg_response_time: number
    error_rate: number
    uptime_percentage: number
  }
}

// API Response Types
export interface AdminDashboardResponse {
  stats: AdminDashboardStats
  recent_actions: AdminActionLog[]
  system_health: SystemHealth
}

export interface UserManagementResponse {
  users: UserManagementData[]
  total_count: number
  page: number
  page_size: number
  filters_applied: Record<string, unknown>
}

export interface PaymentManagementResponse {
  payments: PaymentManagementData[]
  total_count: number
  page: number
  page_size: number
  total_revenue: number
  filters_applied: Record<string, unknown>
}

// Admin Actions
export interface AdminUserAction {
  action: 'suspend' | 'activate' | 'delete' | 'reset_password' | 'upgrade_to_premium' | 'downgrade_to_free'
  user_id: string
  reason?: string
  duration?: number // for temporary suspensions
}

export interface AdminCourseAction {
  action: 'approve' | 'archive' | 'restore' | 'delete' | 'feature'
  course_id: string
  reason?: string
}

export interface AdminReviewAction {
  action: 'approve' | 'reject' | 'flag' | 'delete'
  review_id: string
  reason?: string
  moderator_notes?: string
}

// Filters
export interface UserFilters {
  status?: 'active' | 'suspended' | 'deleted'
  is_premium?: boolean
  registration_date_from?: string
  registration_date_to?: string
  last_active_from?: string
  last_active_to?: string
  search?: string
}

export interface PaymentFilters {
  status?: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan?: string
  amount_min?: number
  amount_max?: number
  date_from?: string
  date_to?: string
  search?: string
}

export interface CourseFilters {
  department?: string
  semester?: string
  year?: string
  status?: 'active' | 'archived' | 'pending_review'
  rating_min?: number
  rating_max?: number
  search?: string
}

export interface ReviewFilters {
  status?: 'approved' | 'pending' | 'rejected' | 'flagged'
  rating_min?: number
  rating_max?: number
  date_from?: string
  date_to?: string
  has_reports?: boolean
  search?: string
}