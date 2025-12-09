import { getDatabase } from '../db/db.js';

/**
 * Получить всех активных участников (публичный эндпоинт)
 * Сортировка: is_leader DESC (глава первый), затем по имени A-Z
 */
export function getActiveMembers() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, role, profile_url, status, avatar_url, order_index, is_leader
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
export function createMember({ name, role, profile_url, status, avatar_url, order_index }) {
  const db = getDatabase();
  
  const finalOrderIndex = order_index ?? (getMaxOrderIndex() + 1);
  
  const stmt = db.prepare(`
    INSERT INTO members (name, role, profile_url, status, avatar_url, order_index, is_leader)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);
  
  const result = stmt.run(
    name,
    role || 'Боец',
    profile_url || null,
    status || 'active',
    avatar_url || null,
    finalOrderIndex
  );
  
  return getMemberById(result.lastInsertRowid);
}

/**
 * Обновить участника (только name, avatar_url, profile_url)
 */
export function updateMember(id, { name, avatar_url, profile_url }) {
  const db = getDatabase();
  
  const current = getMemberById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE members 
    SET 
      name = COALESCE(?, name),
      avatar_url = ?,
      profile_url = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    name || null,
    avatar_url !== undefined ? avatar_url : current.avatar_url,
    profile_url !== undefined ? profile_url : current.profile_url,
    id
  );
  
  return getMemberById(id);
}

/**
 * Удалить участника (жёсткое удаление)
 */
export function deleteMember(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM members WHERE id = ?');
  stmt.run(id);
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
  
  return getMemberById(id);
}

export default {
  getActiveMembers,
  getMemberById,
  getAllMembersAdmin,
  createMember,
  updateMember,
  deleteMember,
  reorderMember,
  setLeader
};
