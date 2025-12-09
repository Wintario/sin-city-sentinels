import { getDatabase } from '../db/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Найти пользователя по username
 */
export function findByUsername(username) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
  return stmt.get(username);
}

/**
 * Найти пользователя по ID
 */
export function findById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, username, role, is_active, created_at, updated_at FROM users WHERE id = ?');
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
 */
export async function createUser(username, password, role = 'author') {
  const db = getDatabase();
  const passwordHash = await hashPassword(password);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, role)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(username, passwordHash, role);
  return findById(result.lastInsertRowid);
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
 * Получить всех пользователей (без паролей)
 */
export function getAllUsers() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, username, role, is_active, created_at, updated_at 
    FROM users 
    ORDER BY id ASC
  `);
  return stmt.all();
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

export default {
  findByUsername,
  findById,
  verifyPassword,
  hashPassword,
  createUser,
  updatePassword,
  getAllUsers,
  deactivateUser
};
