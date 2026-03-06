-- ============================================
-- Миграция 002: Система комментариев
-- ============================================
-- Таблицы: user_profiles, comments, comment_reports, email_verification_tokens
-- Индексы для оптимизации
-- ============================================

-- Отключаем проверку внешних ключей на время миграции
PRAGMA foreign_keys = OFF;

-- 1. Таблица user_profiles (расширение profiles пользователей)
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  arena_nickname TEXT NOT NULL,
  character_url TEXT,
  email_verified INTEGER DEFAULT 0,
  verification_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- 2. Добавляем email в таблицу users (если нет)
-- Примечание: username теперь используется как email
-- Добавляем поле для хранения обычного ника (не email)
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;

-- 3. Таблица comments (комментарии к новостям)
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,  -- для цитирования/ответов
  content TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  hidden_by INTEGER,
  hidden_at DATETIME,
  hidden_reason TEXT,
  edited_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);
-- Индексы для быстрого доступа
CREATE INDEX IF NOT EXISTS idx_comments_news ON comments(news_id, is_hidden, is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- 4. Таблица comment_reports (жалобы на комментарии)
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, reviewed, resolved, rejected
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Индексы для модерации
CREATE INDEX IF NOT EXISTS idx_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON comment_reports(user_id);

-- 5. Таблица email_verification_tokens (токены верификации)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Индекс для быстрого поиска токена
CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);

-- 6. Таблица comment_edits (история редактирования комментариев)
CREATE TABLE IF NOT EXISTS comment_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  old_content TEXT NOT NULL,
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Индекс для истории
CREATE INDEX IF NOT EXISTS idx_comment_edits_comment ON comment_edits(comment_id);

-- ============================================
-- Обновление существующих данных
-- ============================================

-- Копируем username в display_name для существующих пользователей
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Включаем проверку внешних ключей обратно
PRAGMA foreign_keys = ON;

-- ============================================
-- Вывод информации
-- ============================================

-- SELECT 'Migration 002 completed successfully!' AS status;
