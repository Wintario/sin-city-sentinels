-- Миграция 003: Улучшение производительности системы комментариев
-- Добавление индексов и исправление временных меток

-- Индексы для ускорения поиска комментариев
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_news_created ON comments(news_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_hidden ON comments(is_hidden);
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON comments(is_deleted);

-- Индексы для таблицы жалоб
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_user ON comment_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);

-- Индексы для таблицы истории редактирования
CREATE INDEX IF NOT EXISTS idx_comment_edits_comment ON comment_edits(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_edits_user ON comment_edits(user_id);

-- Добавляем колонку deleted_at если её нет
-- Используем ALTER TABLE без IF NOT EXISTS (SQLite < 3.35.0)
-- Примечание: если колонка уже есть, эта команда завершится ошибкой - это нормально
ALTER TABLE comments ADD COLUMN deleted_at DATETIME;

-- Создаём представление для последних активных комментариев
CREATE VIEW IF NOT EXISTS active_comments AS
SELECT 
    c.*,
    u.username as author_username,
    u.email as author_email,
    p.arena_nickname as author_arena_nickname,
    p.character_url as author_character_url
FROM comments c
JOIN users u ON c.user_id = u.id
LEFT JOIN user_profiles p ON c.user_id = p.user_id
WHERE c.is_deleted = 0 AND c.is_hidden = 0
ORDER BY c.created_at DESC;

-- Обновляем существующие удалённые комментарии (устанавливаем deleted_at)
UPDATE comments 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE is_deleted = 1 AND deleted_at IS NULL;
