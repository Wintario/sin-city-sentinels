-- ============================================
-- Миграция 001: Базовая схема аутентификации и комментариев
-- ============================================
-- Таблицы: users, user_profiles, comments, comment_reports, 
--          email_verification_tokens, password_reset_tokens, comment_edits
-- ============================================

-- Отключаем проверку внешних ключей на время миграции
PRAGMA foreign_keys = OFF;

-- ============================================
-- 1. Таблица users (пользователи)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,        -- Ник в Арене (для входа)
  email TEXT NOT NULL UNIQUE,           -- Email (для восстановления пароля)
  password_hash TEXT NOT NULL,          -- Хешированный пароль
  role TEXT NOT NULL DEFAULT 'user',    -- 'user', 'author', 'admin'
  is_active INTEGER DEFAULT 1,          -- Активен ли пользователь
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. Таблица user_profiles (профили пользователей)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  arena_nickname TEXT NOT NULL,         -- Ник в Арене (отображаемое имя)
  character_url TEXT NOT NULL,          -- Ссылка на персонажа (обязательно)
  email_verified INTEGER DEFAULT 0,     -- Верифицирован ли email
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска профиля
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- ============================================
-- 3. Таблица email_verification_tokens (токены верификации email)
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска токена
CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_user ON email_verification_tokens(user_id);

-- ============================================
-- 4. Таблица password_reset_tokens (токены сброса пароля)
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска токена
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);

-- ============================================
-- 5. Таблица comments (комментарии к новостям)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  news_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,                    -- ID родительского комментария (для ответов)
  content TEXT NOT NULL,                -- Текст комментария (с HTML)
  is_deleted INTEGER DEFAULT 0,         -- Удален ли комментарий
  is_hidden INTEGER DEFAULT 0,          -- Скрыт ли модератором
  hidden_by INTEGER,                    -- Кто скрыл
  hidden_at DATETIME,                   -- Когда скрыт
  hidden_reason TEXT,                   -- Причина скрытия
  edited_at DATETIME,                   -- Когда отредактирован
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
);

-- Индексы для быстрого доступа
CREATE INDEX IF NOT EXISTS idx_comments_news ON comments(news_id, is_hidden, is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ============================================
-- 6. Таблица comment_reports (жалобы на комментарии)
-- ============================================
CREATE TABLE IF NOT EXISTS comment_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,             -- Кто пожаловался
  reason TEXT NOT NULL,                 -- Причина жалобы
  status TEXT DEFAULT 'pending',        -- pending, reviewed, resolved, rejected
  reviewed_by INTEGER,                  -- Кто рассмотрел
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индексы для модерации
CREATE INDEX IF NOT EXISTS idx_reports_comment ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON comment_reports(user_id);

-- ============================================
-- 7. Таблица comment_edits (история редактирования комментариев)
-- ============================================
CREATE TABLE IF NOT EXISTS comment_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  old_content TEXT NOT NULL,
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для истории
CREATE INDEX IF NOT EXISTS idx_comment_edits_comment ON comment_edits(comment_id);

-- ============================================
-- Включаем проверку внешних ключей обратно
PRAGMA foreign_keys = ON;

-- ============================================
-- Вывод информации
-- ============================================
SELECT 'Migration 001 completed successfully!' AS status;
