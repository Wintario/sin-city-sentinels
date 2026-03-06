import { getDatabase } from '../db/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Найти пользователя по username (ник в Арене)
 */
export function findByUsername(username) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

/**
 * Найти пользователя по email
 */
export function findByEmail(email) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

/**
 * Найти пользователя по ID
 */
export function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?');
  return stmt.get(id);
}

/**
 * Проверить пароль пользователя
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Захешировать пароль
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Создать нового пользователя
 * @param {string} username - Ник в Арене (для входа)
 * @param {string} email - Email (для восстановления пароля)
 * @param {string} password - Пароль в открытом виде
 * @param {string} role - Роль ('user', 'author', 'admin')
 */
export async function createUser(username, email, password, role = 'user') {
  const db = getDatabase();
  const passwordHash = await hashPassword(password);

  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  const result = stmt.run(username, email, passwordHash, role);
  return findById(result.lastInsertRowid);
}

/**
 * Обновить поля пользователя (username, email)
 */
export function updateUserFields(userId, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  if (updates.username !== undefined) {
    fields.push('username = ?');
    values.push(updates.username);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }

  if (fields.length === 0) return findById(userId);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  stmt.run(...values);
  return findById(userId);
}

/**
 * Обновить пароль пользователя
 */
export async function updatePassword(userId, newPassword) {
  const db = getDatabase();
  const passwordHash = await hashPassword(newPassword);

  const stmt = db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(passwordHash, userId);
  return findById(userId);
}

/**
 * Деактивировать пользователя
 */
export function deactivateUser(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE users
    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(userId);
  return findById(userId);
}

/**
 * Активировать пользователя
 */
export function activateUser(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE users
    SET is_active = 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(userId);
  return findById(userId);
}

/**
 * Обновить роль пользователя
 */
export function updateUserRole(userId, role) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE users
    SET role = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(role, userId);
  return findById(userId);
}

/**
 * Получить всех пользователей с профилями (для админки)
 */
export function getAllUsersWithProfiles() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT u.*, p.arena_nickname, p.character_url, p.email_verified
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    ORDER BY u.created_at DESC
  `);
  return stmt.all();
}

/**
 * Получить пользователей по роли
 */
export function findByRole(role) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, email, role, is_active, created_at
    FROM users
    WHERE role = ? AND is_active = 1
    ORDER BY created_at DESC
  `);
  return stmt.all(role);
}

/**
 * Проверить, является ли пользователь админом или автором
 */
export function hasAdminOrAuthorRole(user) {
  return user && (user.role === 'admin' || user.role === 'author');
}

export default {
  findByUsername,
  findByEmail,
  findById,
  verifyPassword,
  hashPassword,
  createUser,
  updateUserFields,
  updatePassword,
  deactivateUser,
  activateUser,
  updateUserRole,
  getAllUsersWithProfiles,
  findByRole,
  hasAdminOrAuthorRole
};
