-- ============================================
-- Миграция 002: Верификация через персонажа
-- ============================================
-- Таблица character_verification_tokens для хранения токенов верификации
-- ============================================

-- ============================================
-- 1. Таблица character_verification_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS character_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'registration',  -- 'registration' или 'password_reset'
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_char_verification_token ON character_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_char_verification_user ON character_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_char_verification_type ON character_verification_tokens(type);

-- ============================================
-- 2. Добавляем колонку is_verified в user_profiles
-- ============================================
-- Используем существующую email_verified, но для совместимости добавляем is_verified
-- Если колонка уже существует, миграция пропустит этот шаг

-- ============================================
-- Вывод информации
-- ============================================
SELECT 'Migration 002 completed: character_verification_tokens table created!' AS status;
