-- ============================================
-- Миграция 002: Индексы для системы комментариев
-- ============================================
-- Часть 2: Индексы
-- ============================================

-- Индексы для user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verified ON user_profiles(email_verified);

-- Индексы для comments
CREATE INDEX IF NOT EXISTS idx_comments_news ON comments(news_id, is_hidden, is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Индексы для comment_reports
CREATE INDEX IF NOT EXISTS idx_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON comment_reports(user_id);

-- Индексы для email_verification_tokens
CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);

-- Индексы для comment_edits
CREATE INDEX IF NOT EXISTS idx_comment_edits_comment ON comment_edits(comment_id);
