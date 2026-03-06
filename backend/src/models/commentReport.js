import { getDatabase } from '../db/db.js';

/**
 * Создать жалобу на комментарий
 */
export function create(commentId, userId, reason) {
  const db = getDatabase();
  
  // Проверяем, существует ли уже жалоба от этого пользователя на этот комментарий
  const existing = db.prepare(`
    SELECT * FROM comment_reports 
    WHERE comment_id = ? AND user_id = ?
  `).get(commentId, userId);
  
  if (existing) {
    return { error: 'Вы уже жаловались на этот комментарий' };
  }
  
  const stmt = db.prepare(`
    INSERT INTO comment_reports (comment_id, user_id, reason, status)
    VALUES (?, ?, ?, 'pending')
  `);
  const result = stmt.run(commentId, userId, reason);
  
  return getById(result.lastInsertRowid);
}

/**
 * Получить жалобу по ID
 */
export function getById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT r.*,
           c.content as comment_content,
           c.user_id as comment_author_id,
           u.username as reporter_username
    FROM comment_reports r
    JOIN comments c ON r.comment_id = c.id
    JOIN users u ON r.user_id = u.id
    WHERE r.id = ?
  `);
  return stmt.get(id);
}

/**
 * Получить жалобы по статусу с пагинацией
 */
export function getByStatus(status, page = 1, limit = 20) {
  const db = getDatabase();
  const offset = (page - 1) * limit;
  
  const stmt = db.prepare(`
    SELECT r.*,
           c.content as comment_content,
           c.user_id as comment_author_id,
           u.username as reporter_username,
           au.username as reviewer_username
    FROM comment_reports r
    JOIN comments c ON r.comment_id = c.id
    JOIN users u ON r.user_id = u.id
    LEFT JOIN users au ON r.reviewed_by = au.id
    WHERE r.status = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const reports = stmt.all(status, limit, offset);
  
  // Получаем общее количество
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM comment_reports WHERE status = ?
  `);
  const { count } = countStmt.get(status);
  
  return { reports, total: count, page, limit };
}

/**
 * Получить все жалобы на комментарий
 */
export function getByCommentId(commentId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT r.*, u.username as reporter_username
    FROM comment_reports r
    JOIN users u ON r.user_id = u.id
    WHERE r.comment_id = ?
    ORDER BY r.created_at DESC
  `);
  return stmt.all(commentId);
}

/**
 * Обновить статус жалобы
 */
export function updateStatus(id, status, reviewedByUserId = null) {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    UPDATE comment_reports
    SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(status, reviewedByUserId, id);
  
  return getById(id);
}

/**
 * Рассмотреть жалобу (скрыть комментарий если статус resolved)
 */
export function review(id, status, reviewedByUserId, reason = null) {
  const db = getDatabase();
  
  // Обновляем статус жалобы
  const report = updateStatus(id, status, reviewedByUserId);
  
  // Если жалоба подтверждена, скрываем комментарий
  if (status === 'resolved' && reason) {
    db.prepare(`
      UPDATE comments
      SET is_hidden = 1, hidden_by = ?, hidden_at = CURRENT_TIMESTAMP, hidden_reason = ?
      WHERE id = (SELECT comment_id FROM comment_reports WHERE id = ?)
    `).run(reviewedByUserId, reason, id);
  }
  
  return report;
}

/**
 * Получить количество жалоб по статусу
 */
export function getCountByStatus(status) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM comment_reports WHERE status = ?
  `);
  const { count } = stmt.get(status);
  return count;
}

/**
 * Получить сводку по жалобам для админки
 */
export function getSummary() {
  const db = getDatabase();
  return {
    pending: getCountByStatus('pending'),
    reviewed: getCountByStatus('reviewed'),
    resolved: getCountByStatus('resolved'),
    rejected: getCountByStatus('rejected')
  };
}

export default {
  create,
  getById,
  getByStatus,
  getByCommentId,
  updateStatus,
  review,
  getCountByStatus,
  getSummary
};
