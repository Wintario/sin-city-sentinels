import { getDatabase } from '../db/db.js';
import crypto from 'crypto';

/**
 * Создать токен верификации через персонажа
 * @param {number} userId - ID пользователя
 * @param {string} type - Тип токена: 'registration' или 'password_reset'
 * @returns {string} Токен верификации
 */
export function createToken(userId, type = 'registration') {
  const db = getDatabase();
  // Генерируем короткий токен (8 символов) для удобства копирования
  const token = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 часа

  // Удаляем старые токены этого типа для пользователя
  db.prepare('DELETE FROM character_verification_tokens WHERE user_id = ? AND type = ?').run(userId, type);

  const stmt = db.prepare(`
    INSERT INTO character_verification_tokens (user_id, token, type, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(userId, token, type, expiresAt);

  return token;
}

/**
 * Проверить токен верификации
 * @param {string} token - Токен для проверки
 * @returns {object|null} Объект токена или null
 */
export function verifyToken(token) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM character_verification_tokens
    WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
  `);
  const record = stmt.get(token);

  if (!record) return null;

  // Не удаляем токен после использования - он может понадобиться для повторной проверки
  return record;
}

/**
 * Удалить все токены пользователя
 * @param {number} userId - ID пользователя
 */
export function deleteTokensByUserId(userId) {
  const db = getDatabase();
  db.prepare('DELETE FROM character_verification_tokens WHERE user_id = ?').run(userId);
}

/**
 * Удалить токены конкретного типа для пользователя
 * @param {number} userId - ID пользователя
 * @param {string} type - Тип токена
 */
export function deleteTokensByUserIdAndType(userId, type) {
  const db = getDatabase();
  db.prepare('DELETE FROM character_verification_tokens WHERE user_id = ? AND type = ?').run(userId, type);
}

/**
 * Получить токен по пользователю и типу
 * @param {number} userId - ID пользователя
 * @param {string} type - Тип токена
 * @returns {object|null} Объект токена или null
 */
export function getTokenByUserIdAndType(userId, type) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM character_verification_tokens
    WHERE user_id = ? AND type = ? AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `);
  return stmt.get(userId, type);
}

/**
 * Получить токен по пользователю (любой тип)
 * @param {number} userId - ID пользователя
 * @returns {object|null} Объект токена или null
 */
export function getTokenByUserId(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM character_verification_tokens
    WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC
    LIMIT 1
  `);
  return stmt.get(userId);
}

export default {
  createToken,
  verifyToken,
  deleteTokensByUserId,
  deleteTokensByUserIdAndType,
  getTokenByUserIdAndType,
  getTokenByUserId
};
