-- Function to update course statistics when reviews change
CREATE OR REPLACE FUNCTION update_course_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics for the affected course
    UPDATE courses 
    SET 
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        average_difficulty = (
            SELECT COALESCE(AVG(difficulty), 0) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        average_workload = (
            SELECT COALESCE(AVG(workload), 0) 
            FROM reviews 
            WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers for course statistics updates
CREATE TRIGGER update_course_stats_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_statistics();

CREATE TRIGGER update_course_stats_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_statistics();

CREATE TRIGGER update_course_stats_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_statistics();

-- Function to update review helpful count
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reviews 
    SET helpful_count = (
        SELECT COUNT(*) 
        FROM review_votes 
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
        AND is_helpful = true
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers for review helpful count updates
CREATE TRIGGER update_helpful_count_on_vote_insert
    AFTER INSERT ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

CREATE TRIGGER update_helpful_count_on_vote_update
    AFTER UPDATE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

CREATE TRIGGER update_helpful_count_on_vote_delete
    AFTER DELETE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_count();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, created_at, updated_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NOW(), NOW());
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();