-- 管理者ユーザーテーブル
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- 管理者アクションログテーブル
CREATE TABLE admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('user', 'course', 'review', 'subscription', 'system')),
    target_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- システム設定テーブル
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レビュー報告テーブル
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー状態管理テーブル
CREATE TABLE user_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    reason TEXT,
    suspended_until TIMESTAMP WITH TIME ZONE,
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- インデックス作成
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

CREATE INDEX idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_action_logs_target_type ON admin_action_logs(target_type);
CREATE INDEX idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);

CREATE INDEX idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(status);
CREATE INDEX idx_review_reports_created_at ON review_reports(created_at DESC);

CREATE INDEX idx_user_status_user_id ON user_status(user_id);
CREATE INDEX idx_user_status_status ON user_status(status);

-- RLS (Row Level Security) ポリシー
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- 管理者ユーザーポリシー
CREATE POLICY "管理者は自分の情報を閲覧可能" ON admin_users
    FOR SELECT USING (
        user_id = auth.uid() AND is_active = true
    );

CREATE POLICY "スーパー管理者は全ての管理者情報を管理可能" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role = 'super_admin' 
            AND au.is_active = true
        )
    );

-- アクションログポリシー
CREATE POLICY "管理者はアクションログを閲覧可能" ON admin_action_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "管理者はアクションログを挿入可能" ON admin_action_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

-- システム設定ポリシー
CREATE POLICY "管理者はシステム設定を閲覧可能" ON system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "スーパー管理者はシステム設定を管理可能" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role = 'super_admin' 
            AND au.is_active = true
        )
    );

-- レビュー報告ポリシー
CREATE POLICY "認証ユーザーはレビューを報告可能" ON review_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "管理者はレビュー報告を管理可能" ON review_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

-- ユーザー状態ポリシー
CREATE POLICY "管理者はユーザー状態を管理可能" ON user_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role IN ('admin', 'super_admin')
            AND au.is_active = true
        )
    );

-- 関数：更新時刻の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_status_updated_at 
    BEFORE UPDATE ON user_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ビュー：管理者ダッシュボード統計用
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    -- ユーザー統計
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= DATE_TRUNC('month', NOW())) as new_users_this_month,
    (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active', 'trialing')) as premium_users,
    (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at >= NOW() - INTERVAL '30 days') as active_users_last_30_days,
    
    -- コース統計
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM courses WHERE created_at >= DATE_TRUNC('month', NOW())) as new_courses_this_month,
    
    -- レビュー統計
    (SELECT COUNT(*) FROM reviews) as total_reviews,
    (SELECT COUNT(*) FROM reviews WHERE created_at >= DATE_TRUNC('month', NOW())) as new_reviews_this_month,
    (SELECT AVG(rating)::NUMERIC(3,2) FROM reviews) as average_rating,
    
    -- 収益統計
    (SELECT COALESCE(SUM(amount), 0) FROM billing_history 
     WHERE status = 'paid' AND created_at >= DATE_TRUNC('month', NOW())) as revenue_this_month,
    (SELECT COALESCE(SUM(amount), 0) FROM billing_history WHERE status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active', 'trialing')) as active_subscriptions;

-- 初期データ挿入（例：システム設定）
INSERT INTO system_settings (key, value, description) VALUES
('site_name', '"City2 大学評価プラットフォーム"', 'サイト名'),
('maintenance_mode', 'false', 'メンテナンスモード'),
('max_reviews_per_course', '1000', 'コースあたりの最大レビュー数'),
('review_moderation_enabled', 'true', 'レビューの事前審査'),
('email_notifications_enabled', 'true', 'メール通知機能'),
('premium_features_enabled', 'true', 'プレミアム機能');

-- 管理者ユーザーの作成例（実際の使用時は適切なuser_idを設定）
-- INSERT INTO admin_users (user_id, role, name) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'super_admin', 'システム管理者');