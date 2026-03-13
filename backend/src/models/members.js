import { getDatabase } from '../db/db.js';
import logger from '../utils/logger.js';
import { fetchCharacterPage, parseCharacterInfo } from '../services/characterVerificationService.js';

const mapCharacterMeta = (parsed) => ({
  character_image: parsed?.imageUrl || null,
  character_level: parsed?.level ?? null,
  race_code: parsed?.raceCode || null,
  race_class: parsed?.raceClass || null,
  race_title: parsed?.raceTitle || null,
  race_style: parsed?.raceStyle || null,
  clan_name: parsed?.clanName || null,
  clan_url: parsed?.clanUrl || null,
  clan_icon: parsed?.clanIcon || null,
});

async function enrichMemberWithCharacterMeta(data) {
  const profileUrl = data?.profile_url?.trim();
  if (!profileUrl) {
    return data;
  }

  try {
    const html = await fetchCharacterPage(profileUrl);
    const parsed = parseCharacterInfo(html, profileUrl);
    return {
      ...data,
      ...mapCharacterMeta(parsed),
    };
  } catch (error) {
    logger.warn('Failed to import member character metadata', { profile_url: profileUrl, error: error.message });
    return data;
  }
}

/**
 * Получить всех активных участников (публичный эндпоинт)
 * Сортировка: is_leader DESC (глава первый), затем по имени A-Z
 */
export function getActiveMembers() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, role, profile_url, status, avatar_url, order_index, is_leader,
           character_image, character_level, race_code, race_class, race_title, race_style,
           clan_name, clan_url, clan_icon
    FROM members
    WHERE status != 'deleted'
    ORDER BY 
      CASE WHEN is_leader = 1 THEN 0 ELSE 1 END,
      name COLLATE NOCASE ASC
  `);
  return stmt.all();
}

/**
 * Получить участника по ID
 */
export function getMemberById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM members WHERE id = ?
  `);
  return stmt.get(id);
}

/**
 * Получить участника по имени (nickname)
 */
export function getMemberByName(name) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM members WHERE LOWER(name) = LOWER(?)
  `);
  return stmt.get(name);
}

/**
 * Получить всех участников для админки
 * Сортировка: is_leader DESC (глава первый), затем по имени A-Z
 */
export function getAllMembersAdmin() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM members
    ORDER BY 
      CASE WHEN is_leader = 1 THEN 0 ELSE 1 END,
      name COLLATE NOCASE ASC
  `);
  return stmt.all();
}

/**
 * Получить максимальный order_index
 */
function getMaxOrderIndex() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT MAX(order_index) as max_order FROM members');
  const result = stmt.get();
  return result?.max_order || 0;
}

/**
 * Создать нового участника
 */
export async function createMember({ name, role, profile_url, status, avatar_url, order_index, is_leader }) {
  const db = getDatabase();
  const payload = await enrichMemberWithCharacterMeta({ name, role, profile_url, status, avatar_url, order_index, is_leader });
  
  const finalOrderIndex = payload.order_index ?? (getMaxOrderIndex() + 1);
  
  const stmt = db.prepare(`
    INSERT INTO members (
      name, role, profile_url, status, avatar_url, order_index, is_leader,
      character_image, character_level, race_code, race_class, race_title, race_style,
      clan_name, clan_url, clan_icon
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    payload.name,
    payload.role || 'Боец',
    payload.profile_url || null,
    payload.status || 'active',
    payload.avatar_url || null,
    finalOrderIndex,
    payload.is_leader ? 1 : 0,
    payload.character_image || null,
    payload.character_level ?? null,
    payload.race_code || null,
    payload.race_class || null,
    payload.race_title || null,
    payload.race_style || null,
    payload.clan_name || null,
    payload.clan_url || null,
    payload.clan_icon || null
  );
  
  logger.info(`Member created: ${payload.name}`, { id: result.lastInsertRowid });
  
  return getMemberById(result.lastInsertRowid);
}

/**
 * Обновить участника (только name, avatar_url, profile_url)
 */
export async function updateMember(id, { name, avatar_url, profile_url }) {
  const db = getDatabase();
  
  const current = getMemberById(id);
  if (!current) return null;

  const payload = await enrichMemberWithCharacterMeta({
    name: name ?? current.name,
    profile_url: profile_url !== undefined ? profile_url : current.profile_url,
    avatar_url: avatar_url !== undefined ? avatar_url : current.avatar_url,
  });
  
  const stmt = db.prepare(`
    UPDATE members 
    SET 
      name = COALESCE(?, name),
      avatar_url = ?,
      profile_url = ?,
      character_image = ?,
      character_level = ?,
      race_code = ?,
      race_class = ?,
      race_title = ?,
      race_style = ?,
      clan_name = ?,
      clan_url = ?,
      clan_icon = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    payload.name || null,
    payload.avatar_url !== undefined ? payload.avatar_url : current.avatar_url,
    payload.profile_url !== undefined ? payload.profile_url : current.profile_url,
    payload.character_image !== undefined ? payload.character_image : current.character_image,
    payload.character_level !== undefined ? payload.character_level : current.character_level,
    payload.race_code !== undefined ? payload.race_code : current.race_code,
    payload.race_class !== undefined ? payload.race_class : current.race_class,
    payload.race_title !== undefined ? payload.race_title : current.race_title,
    payload.race_style !== undefined ? payload.race_style : current.race_style,
    payload.clan_name !== undefined ? payload.clan_name : current.clan_name,
    payload.clan_url !== undefined ? payload.clan_url : current.clan_url,
    payload.clan_icon !== undefined ? payload.clan_icon : current.clan_icon,
    id
  );
  
  logger.info(`Member updated: ${current.name}`, { id });
  
  return getMemberById(id);
}

/**
 * Массовое обновление или создание участников (для импорта)
 */
export async function bulkUpsertMembers(members) {
  const results = { updated: 0, created: 0, processed: [] };
  
  for (const member of members) {
    try {
      const existing = getMemberByName(member.nickname);
      
      const avatarUrl = `/avatars/${member.filename}`;
      const profileUrl = `https://kovcheg2.apeha.ru/info.html?user=${member.user_id}`;
      
      if (existing) {
        // Обновляем существующего
        await updateMember(existing.id, {
          avatar_url: avatarUrl,
          profile_url: profileUrl
        });
        results.updated++;
        results.processed.push({ name: member.nickname, action: 'updated' });
      } else {
        // Создаём нового
        await createMember({
          name: member.nickname,
          avatar_url: avatarUrl,
          profile_url: profileUrl,
          status: 'active',
          is_leader: false
        });
        results.created++;
        results.processed.push({ name: member.nickname, action: 'created' });
      }
    } catch (err) {
      logger.error(`Error processing member ${member.nickname}`, err);
      results.processed.push({ name: member.nickname, action: 'error', error: err.message });
    }
  }
  
  logger.info('Bulk import completed', results);
  
  return results;
}

/**
 * Удалить участника (жёсткое удаление)
 */
export function deleteMember(id) {
  const db = getDatabase();
  const member = getMemberById(id);
  const stmt = db.prepare('DELETE FROM members WHERE id = ?');
  stmt.run(id);
  logger.info(`Member deleted: ${member?.name}`, { id });
  return { success: true, message: 'Member deleted' };
}

/**
 * Изменить порядок участника
 */
export function reorderMember(id, newOrderIndex) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE members 
    SET order_index = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(newOrderIndex, id);
  return getMemberById(id);
}

/**
 * Установить лидера клана
 */
export function setLeader(id) {
  const db = getDatabase();
  
  // Сначала убираем is_leader у всех
  db.prepare('UPDATE members SET is_leader = 0').run();
  
  // Устанавливаем нового лидера
  db.prepare('UPDATE members SET is_leader = 1 WHERE id = ?').run(id);
  
  logger.info(`Leader set`, { id });
  
  return getMemberById(id);
}

export default {
  getActiveMembers,
  getMemberById,
  getMemberByName,
  getAllMembersAdmin,
  createMember,
  updateMember,
  bulkUpsertMembers,
  deleteMember,
  reorderMember,
  setLeader
};
