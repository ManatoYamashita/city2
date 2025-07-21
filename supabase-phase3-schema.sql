-- Phase 3: Stripe決済システム用データベーススキーマ拡張
-- Supabase SQL Editorで実行してください

-- 1. Stripe顧客テーブル
CREATE TABLE stripe_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. サブスクリプションテーブル
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  price_id TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 1ユーザーにつき1つのアクティブなサブスクリプション
  UNIQUE(user_id, status) WHERE status IN ('active', 'trialing', 'past_due')
);

-- 3. 請求履歴テーブル
CREATE TABLE billing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- 金額（最小通貨単位）
  currency TEXT NOT NULL DEFAULT 'jpy',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description TEXT,
  invoice_url TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 使用量制限テーブル
CREATE TABLE usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('reviews_per_month', 'searches_per_day')),
  used_count INTEGER DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, feature, reset_date)
);

-- 5. プレミアム機能ログテーブル
CREATE TABLE premium_feature_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. プロフィールテーブルにStripe関連カラム追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_features_enabled JSONB DEFAULT '{}';

-- 7. インデックス作成
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);
CREATE INDEX idx_billing_history_created_at ON billing_history(created_at);

CREATE INDEX idx_usage_limits_user_feature ON usage_limits(user_id, feature);
CREATE INDEX idx_usage_limits_reset_date ON usage_limits(reset_date);

CREATE INDEX idx_premium_logs_user_id ON premium_feature_logs(user_id);
CREATE INDEX idx_premium_logs_feature ON premium_feature_logs(feature);
CREATE INDEX idx_premium_logs_created_at ON premium_feature_logs(created_at);

-- 8. Row Level Security (RLS) 有効化
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_feature_logs ENABLE ROW LEVEL SECURITY;

-- 9. RLSポリシー設定

-- Stripe顧客テーブル: 自分の情報のみアクセス可能
CREATE POLICY "stripe_customers_select" ON stripe_customers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "stripe_customers_insert" ON stripe_customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stripe_customers_update" ON stripe_customers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- サブスクリプションテーブル: 自分の情報のみアクセス可能
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 請求履歴テーブル: 自分の情報のみ閲覧可能
CREATE POLICY "billing_history_select" ON billing_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "billing_history_insert" ON billing_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 使用量制限テーブル: 自分の情報のみアクセス可能
CREATE POLICY "usage_limits_select" ON usage_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "usage_limits_insert" ON usage_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usage_limits_update" ON usage_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- プレミアム機能ログテーブル: 自分の情報のみ閲覧可能
CREATE POLICY "premium_logs_select" ON premium_feature_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "premium_logs_insert" ON premium_feature_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 10. トリガー関数: プロフィール自動更新
CREATE OR REPLACE FUNCTION update_profile_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- サブスクリプション作成・更新時にプロフィールを更新
  UPDATE profiles 
  SET 
    subscription_status = NEW.status,
    is_premium = CASE 
      WHEN NEW.status IN ('active', 'trialing') THEN true 
      ELSE false 
    END,
    premium_expires_at = CASE 
      WHEN NEW.status IN ('active', 'trialing') THEN NEW.current_period_end
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER trigger_update_profile_subscription_status
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_profile_subscription_status();

-- 11. トリガー関数: Stripe顧客IDの同期
CREATE OR REPLACE FUNCTION sync_stripe_customer_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Stripe顧客作成時にプロフィールにもIDを保存
  UPDATE profiles 
  SET 
    stripe_customer_id = NEW.stripe_customer_id,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER trigger_sync_stripe_customer_id
  AFTER INSERT OR UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION sync_stripe_customer_id();

-- 12. トリガー関数: 使用量制限のリセット
CREATE OR REPLACE FUNCTION reset_usage_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- 期限切れの使用量制限をリセット
  UPDATE usage_limits 
  SET 
    used_count = 0,
    reset_date = CASE
      WHEN feature = 'reviews_per_month' THEN 
        (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::timestamp with time zone
      WHEN feature = 'searches_per_day' THEN 
        (DATE_TRUNC('day', NOW()) + INTERVAL '1 day')::timestamp with time zone
      ELSE reset_date
    END,
    updated_at = NOW()
  WHERE reset_date <= NOW();
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. 定期実行用関数: 期限切れサブスクリプションの処理
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS void AS $$
BEGIN
  -- 期限切れのトライアルを無効化
  UPDATE subscriptions 
  SET 
    status = 'incomplete_expired',
    updated_at = NOW()
  WHERE status = 'trialing' 
    AND trial_end IS NOT NULL 
    AND trial_end < NOW();
    
  -- 期限切れサブスクリプションのプロフィール更新
  UPDATE profiles 
  SET 
    is_premium = false,
    premium_expires_at = NULL,
    subscription_status = 'inactive',
    updated_at = NOW()
  WHERE id IN (
    SELECT user_id FROM subscriptions 
    WHERE status IN ('canceled', 'incomplete_expired', 'unpaid')
  );
END;
$$ LANGUAGE plpgsql;

-- 14. updated_atトリガー設定
CREATE TRIGGER trigger_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_usage_limits_updated_at BEFORE UPDATE ON usage_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. 管理者用ビュー作成
CREATE VIEW admin_subscription_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'trialing') as trial_subscriptions,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
  COUNT(*) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
  SUM(CASE WHEN bh.amount > 0 AND bh.status = 'paid' THEN bh.amount ELSE 0 END) as total_revenue
FROM subscriptions s
LEFT JOIN billing_history bh ON bh.user_id = s.user_id
WHERE s.created_at >= DATE_TRUNC('month', NOW());

-- プレミアム機能使用統計ビュー
CREATE VIEW premium_feature_usage_stats AS
SELECT 
  feature,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as date
FROM premium_feature_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY feature, DATE_TRUNC('day', created_at)
ORDER BY date DESC, feature;