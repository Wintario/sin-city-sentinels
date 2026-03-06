import { getDatabase } from '../db/db.js';
import bcrypt from 'bcrypt';

/**
 * Забанить пользователя
 * @param {number} userId - ID пользователя
 * @param {number} bannedBy - ID забанившего (админ)
 * @param {string} reason - Причина бана
 * @param {Date|null} banEnd - Дата окончания бана (null для постоянного)
 * @param {boolean} isPermanent - Постоянный ли бан
 */
export function banUser(userId, bannedBy, reason, banEnd, isPermanent = false) {
  const db = getDatabase();
  
  // Деактивируем старые активные баны этого пользователя
  db.prepare(`
    UPDATE user_bans SET is_active = 0 WHERE user_id = ? AND is_active = 1
  `).run(userId);
  
  const stmt = db.prepare(`
    INSERT INTO user_bans (user_id, banned_by, ban_reason, ban_end, is_permanent)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, bannedBy, reason, banEnd ? banEnd.toISOString() : null, isPermanent ? 1 : 0);
  
  // Деактивируем пользователя
  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(userId);
  
  return getBanInfo(userId);
}

/**
 * Получить информацию о текущем бане пользователя
 * @param {number} userId - ID пользователя
 * @returns {object|null} Информация о бане или null
 */
export function getBanInfo(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT b.*, u.username as banned_by_username
    FROM user_bans b
    LEFT JOIN users u ON b.banned_by = u.id
    WHERE b.user_id = ? AND b.is_active = 1
    ORDER BY b.created_at DESC
    LIMIT 1
  `);
  return stmt.get(userId);
}

/**
 * Проверить, забанен ли пользователь
 * @param {number} userId - ID пользователя
 * @returns {object|null} Информация о бане или null
 */
export function isBanned(userId) {
  const db = getDatabase();
  const ban = getBanInfo(userId);
  
  if (!ban) return null;
  
  // Проверяем, не истёк ли бан
  if (ban.ban_end && new Date(ban.ban_end) < new Date()) {
    // Бан истёк, деактивируем его
    db.prepare('UPDATE user_bans SET is_active = 0 WHERE id = ?').run(ban.id);
    // Активируем пользователя
    db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(userId);
    return null;
  }
  
  return ban;
}

/**
 * Разбанить пользователя
 * @param {number} userId - ID пользователя
 */
export function unbanUser(userId) {
  const db = getDatabase();
  
  // Деактивируем все активные баны
  db.prepare(`
    UPDATE user_bans SET is_active = 0 WHERE user_id = ? AND is_active = 1
  `).run(userId);
  
  // Активируем пользователя
  db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(userId);
  
  return { success: true, message: 'Пользователь разбанен' };
}

/**
 * Полностью удалить пользователя из БД (деактивация с переносом контента)
 * @param {number} userId - ID пользователя
 */
export function permanentDelete(userId) {
  const db = getDatabase();

  // Находим или создаём системного пользователя "deleted_user"
  let deletedUser = db.prepare('SELECT id FROM users WHERE username = ?').get('deleted_user');
  if (!deletedUser) {
    // Создаём системного пользователя для переноса контента
    const passwordHash = bcrypt.hashSync('deleted', 10);
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ('deleted_user', 'deleted@system.local', ?, 'user', 0)
    `);
    const result = stmt.run(passwordHash);
    deletedUser = { id: result.lastInsertRowid };
    
    // Создаём профиль
    db.prepare(`
      INSERT INTO user_profiles (user_id, arena_nickname, character_url, email_verified)
      VALUES (?, 'Удалённый пользователь', '', 0)
    `).run(deletedUser.id);
  }

  const deletedUserId = deletedUser.id;

  // Переносим новости на deleted_user
  db.prepare('UPDATE news SET author_id = ? WHERE author_id = ?').run(deletedUserId, userId);

  // Переносим комментарии на deleted_user
  db.prepare('UPDATE comments SET user_id = ? WHERE user_id = ?').run(deletedUserId, userId);

  // Переносим жалобы на deleted_user
  db.prepare('UPDATE comment_reports SET user_id = ? WHERE user_id = ?').run(deletedUserId, userId);

  // Переносим просмотры на deleted_user
  db.prepare('UPDATE page_views SET user_id = ? WHERE user_id = ?').run(deletedUserId, userId);

  // Удаляем баны (если есть)
  db.prepare('DELETE FROM user_bans WHERE user_id = ?').run(userId);

  // Удаляем токены верификации
  db.prepare('DELETE FROM character_verification_tokens WHERE user_id = ?').run(userId);

  // Удаляем профиль пользователя
  db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId);

  // Удаляем email verification токены
  db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(userId);

  // Удаляем password reset токены
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(userId);

  // Деактивируем пользователя (не удаляем полностью!)
  db.prepare('UPDATE users SET is_active = 0, is_deleted = 1 WHERE id = ?').run(userId);

  return { success: true, message: 'Пользователь деактивирован, контент перенесён' };
}

/**
 * Получить всех забаненных пользователей с пагинацией
 * @param {number} page - Страница
 * @param {number} limit - Лимит
 * @returns {object} { bans, total }
 */
export function getBannedUsers(page = 1, limit = 20) {
  const db = getDatabase();
  const offset = (page - 1) * limit;
  
  const stmt = db.prepare(`
    SELECT b.*, 
           u.username as user_username,
           u2.username as banned_by_username
    FROM user_bans b
    JOIN users u ON b.user_id = u.id
    LEFT JOIN users u2 ON b.banned_by = u2.id
    WHERE b.is_active = 1
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const bans = stmt.all(limit, offset);
  
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_bans WHERE is_active = 1
  `);
  const { count } = countStmt.get();
  
  return { bans, total: count };
}

export default {
  banUser,
  getBanInfo,
  isBanned,
  unbanUser,
  permanentDelete,
  getBannedUsers
};
