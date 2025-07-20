-- Enable Row Level Security on all tables
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Universities policies
-- All users can read universities
CREATE POLICY "Universities are viewable by everyone" ON universities
    FOR SELECT USING (true);

-- Only admins can insert/update/delete universities
CREATE POLICY "Only admins can manage universities" ON universities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.is_admin = true
        )
    );

-- Courses policies
-- All authenticated users can view courses
CREATE POLICY "Courses are viewable by authenticated users" ON courses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can manage courses
CREATE POLICY "Only admins can manage courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Reviews policies
-- All authenticated users can view reviews
CREATE POLICY "Reviews are viewable by authenticated users" ON reviews
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Review votes policies
-- All authenticated users can view votes
CREATE POLICY "Review votes are viewable by authenticated users" ON review_votes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own votes
CREATE POLICY "Users can insert own votes" ON review_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON review_votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" ON review_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Past exams policies (Premium feature)
-- Only premium users can view past exams
CREATE POLICY "Only premium users can view past exams" ON past_exams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.is_premium = true 
                AND profiles.premium_expires_at > NOW()
            )
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Premium users can upload past exams
CREATE POLICY "Premium users can upload past exams" ON past_exams
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.is_premium = true 
                AND profiles.premium_expires_at > NOW()
            )
        )
    );

-- Users can update their own uploaded exams
CREATE POLICY "Users can update own uploaded exams" ON past_exams
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Users can delete their own uploaded exams
CREATE POLICY "Users can delete own uploaded exams" ON past_exams
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Admins can manage all past exams
CREATE POLICY "Admins can manage all past exams" ON past_exams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Subscriptions policies
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Functions for checking user permissions
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.is_premium_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_premium = true 
        AND profiles.premium_expires_at > NOW()
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;