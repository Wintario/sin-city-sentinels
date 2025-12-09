import { getDatabase } from '../db/db.js';

/**
 * Получить всех активных участников (публичный эндпоинт)
 */
export function getActiveMembers() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, name, role, profile_url, status, avatar_url, order_index
    FROM members
    WHERE status != 'deleted'
    ORDER BY order_index ASC, id ASC
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
 */
export function getAllMembersAdmin() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM members
    ORDER BY order_index ASC, id ASC
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
  
  // Если order_index не указан, добавляем в конец
  const finalOrderIndex = order_index ?? (getMaxOrderIndex() + 1);
  
  const stmt = db.prepare(`
    INSERT INTO members (name, role, profile_url, status, avatar_url, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    name,
    role,
    profile_url || null,
    status || 'active',
    avatar_url || null,
    finalOrderIndex
  );
  
  return getMemberById(result.lastInsertRowid);
}

/**
 * Обновить участника
 */
export function updateMember(id, { name, role, profile_url, status, avatar_url, order_index }) {
  const db = getDatabase();
  
  const current = getMemberById(id);
  if (!current) return null;
  
  const stmt = db.prepare(`
    UPDATE members 
    SET 
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      profile_url = COALESCE(?, profile_url),
      status = COALESCE(?, status),
      avatar_url = COALESCE(?, avatar_url),
      order_index = COALESCE(?, order_index),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    name || null,
    role || null,
    profile_url,
    status || null,
    avatar_url,
    order_index ?? null,
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

export default {
  getActiveMembers,
  getMemberById,
  getAllMembersAdmin,
  createMember,
  updateMember,
  deleteMember,
  reorderMember
};
