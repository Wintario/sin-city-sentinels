import { getDatabase } from '../db/db.js';

/**
 * Создать профиль пользователя
 * @param {number} userId - ID пользователя
 * @param {string} arenaNickname - Ник в Арене
 * @param {string} characterUrl - Ссылка на персонажа
 */
export function createProfile(userId, arenaNickname, characterUrl) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO user_profiles (user_id, arena_nickname, character_url)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, arenaNickname, characterUrl);
  return getProfileByUserId(result.lastInsertRowid);
}

/**
 * Получить профиль по ID пользователя
 */
export function getProfileByUserId(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM user_profiles WHERE user_id = ?
  `);
  return stmt.get(userId);
}

/**
 * Получить профиль по ID
 */
export function getProfileById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM user_profiles WHERE id = ?
  `);
  return stmt.get(id);
}

/**
 * Обновить профиль
 */
export function updateProfile(userId, updates) {
  const db = getDatabase();
  const fields = [];
  const values = [];

  if (updates.arena_nickname !== undefined) {
    fields.push('arena_nickname = ?');
    values.push(updates.arena_nickname);
  }
  if (updates.character_url !== undefined) {
    fields.push('character_url = ?');
    values.push(updates.character_url);
  }
  if (updates.character_image !== undefined) {
    fields.push('character_image = ?');
    values.push(updates.character_image);
  }
  if (updates.clan_name !== undefined) {
    fields.push('clan_name = ?');
    values.push(updates.clan_name);
  }
  if (updates.clan_url !== undefined) {
    fields.push('clan_url = ?');
    values.push(updates.clan_url);
  }
  if (updates.clan_icon !== undefined) {
    fields.push('clan_icon = ?');
    values.push(updates.clan_icon);
  }
  if (updates.is_target_clan_member !== undefined) {
    fields.push('is_target_clan_member = ?');
    values.push(updates.is_target_clan_member ? 1 : 0);
  }
  if (updates.clan_checked_at !== undefined) {
    fields.push('clan_checked_at = ?');
    values.push(updates.clan_checked_at);
  }
  if (updates.character_level !== undefined) {
    fields.push('character_level = ?');
    values.push(updates.character_level);
  }
  if (updates.race_code !== undefined) {
    fields.push('race_code = ?');
    values.push(updates.race_code);
  }
  if (updates.race_class !== undefined) {
    fields.push('race_class = ?');
    values.push(updates.race_class);
  }
  if (updates.race_title !== undefined) {
    fields.push('race_title = ?');
    values.push(updates.race_title);
  }
  if (updates.race_style !== undefined) {
    fields.push('race_style = ?');
    values.push(updates.race_style);
  }

  if (fields.length === 0) return getProfileByUserId(userId);

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const stmt = db.prepare(`
    UPDATE user_profiles
    SET ${fields.join(', ')}
    WHERE user_id = ?
  `);
  stmt.run(...values);
  return getProfileByUserId(userId);
}

/**
 * Установить верификацию пользователя (через email или персонажа)
 */
export function setEmailVerified(userId, verified = true) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE user_profiles
    SET email_verified = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `);
  stmt.run(verified ? 1 : 0, userId);
  return getProfileByUserId(userId);
}

/**
 * Установить верификацию пользователя (алиас для setEmailVerified)
 */
export function setVerified(userId, verified = true) {
  return setEmailVerified(userId, verified);
}

/**
 * Получить все профили (для админки)
 */
export function getAllProfiles() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT p.*, u.username, u.role, u.is_active, u.created_at
    FROM user_profiles p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `);
  return stmt.all();
}

/**
 * Проверить, существует ли профиль с таким character_url
 */
export function existsByCharacterUrl(characterUrl) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM user_profiles WHERE character_url = ?
  `);
  const result = stmt.get(characterUrl);
  return result.count > 0;
}

/**
 * Очистить осиротевшие профили (у которых нет пользователя)
 */
export function cleanupOrphanProfiles() {
  const db = getDatabase();
  const stmt = db.prepare(`
    DELETE FROM user_profiles 
    WHERE user_id NOT IN (SELECT id FROM users)
  `);
  const result = stmt.run();
  return result.changes;
}

export default {
  createProfile,
  getProfileByUserId,
  getProfileById,
  updateProfile,
  setEmailVerified,
  setVerified,
  getAllProfiles,
  existsByCharacterUrl,
  cleanupOrphanProfiles
};
