-- ============================================
-- Миграция 002: Система комментариев
-- ============================================
-- Часть 1: Таблицы
-- ============================================

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

-- 2. Добавляем поля в таблицу users
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;

-- 3. Таблица comments (комментарии к новостям)
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,
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

-- 4. Таблица comment_reports (жалобы на комментарии)
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица email_verification_tokens (токены верификации)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Таблица comment_edits (история редактирования комментариев)
CREATE TABLE IF NOT EXISTS comment_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  old_content TEXT NOT NULL,
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Обновление существующих данных
-- ============================================

-- Копируем username в display_name для существующих пользователей
UPDATE users SET display_name = username WHERE display_name IS NULL;
