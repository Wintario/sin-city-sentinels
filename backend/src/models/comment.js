import { getDatabase } from '../db/db.js';

const COMMENT_EDIT_WINDOW_MS = 60 * 60 * 1000; // 1 час
const MAX_EMOJIS = 10;

function parseLocalDateTime(dateTimeStr) {
  if (!dateTimeStr) return Date.now();

  const asUtc = Date.parse(dateTimeStr.replace(' ', 'T') + 'Z');
  if (!Number.isNaN(asUtc)) {
    return asUtc;
  }

  const asLocal = Date.parse(dateTimeStr);
  return Number.isNaN(asLocal) ? Date.now() : asLocal;
}
/**
 * Подсчет количества смайлов в тексте
 */
function countEmojis(str) {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const matches = str.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Проверка на превышение лимита смайлов
 */
export function validateEmojiCount(content) {
  const count = countEmojis(content);
  if (count > MAX_EMOJIS) {
    return {
      valid: false,
      error: `Слишком много смайлов (макс. ${MAX_EMOJIS}, найдено ${count})`
    };
  }
  return { valid: true, count };
}

/**
 * Создать комментарий
 */
export function create(newsId, userId, content, parentId = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO comments (news_id, user_id, parent_id, content)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(newsId, userId, parentId, content);
  return getById(result.lastInsertRowid);
}

/**
 * Получить комментарий по ID с информацией об авторе
 */
export function getById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT c.id,
           c.news_id,
           c.user_id,
           c.parent_id,
           c.content,
           c.is_deleted,
           c.is_hidden,
           c.hidden_by,
           c.hidden_at,
           c.hidden_reason,
           c.edited_at,
           c.created_at,
           u.username as author_username,
           u.email as author_email,
           p.arena_nickname as author_arena_nickname,
           p.character_url as author_character_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN user_profiles p ON c.user_id = p.user_id
    WHERE c.id = ?
  `);
  return stmt.get(id);
}

/**
 * Получить комментарии к новости с пагинацией
 */
export function getByNewsId(newsId, page = 1, limit = 20, includeHidden = false) {
  const db = getDatabase();
  const offset = (page - 1) * limit;

  const hiddenFilter = includeHidden ? '' : 'AND comments.is_hidden = 0';

  const stmt = db.prepare(`
    SELECT comments.id,
           comments.news_id,
           comments.user_id,
           comments.parent_id,
           comments.content,
           comments.is_deleted,
           comments.is_hidden,
           comments.hidden_by,
           comments.hidden_at,
           comments.hidden_reason,
           comments.edited_at,
           comments.created_at,
           u.username as author_username,
           p.arena_nickname as author_arena_nickname,
           p.character_url as author_character_url
    FROM comments
    JOIN users u ON comments.user_id = u.id
    LEFT JOIN user_profiles p ON comments.user_id = p.user_id
    WHERE comments.news_id = ? AND comments.is_deleted = 0 ${hiddenFilter}
    ORDER BY comments.created_at ASC
    LIMIT ? OFFSET ?
  `);

  const comments = stmt.all(newsId, limit, offset);

  // Получаем общее количество
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM comments
    WHERE news_id = ? AND is_deleted = 0 ${hiddenFilter}
  `);
  const { count } = countStmt.get(newsId);

  return { comments, total: count, page, limit };
}

/**
 * Обновить комментарий (в течение 1 часа после создания)
 */
export function update(id, userId, newContent) {
  const db = getDatabase();
  
  try {
    const comment = getById(id);

    if (!comment) {
      console.warn(`Comment ${id} not found`);
      return null;
    }
    
    if (comment.user_id !== userId) {
      console.warn(`User ${userId} is not owner of comment ${id}`);
      return null;
    }

    if (comment.is_deleted) {
      console.warn(`Comment ${id} is deleted`);
      return null;
    }

    // Проверка времени редактирования - 1 час с момента создания
    const createdAt = parseLocalDateTime(comment.created_at);
    const now = Date.now();
    const timeSinceCreation = now - createdAt;
    const minutesSinceCreation = Math.round(timeSinceCreation / 1000 / 60);
    const editWindowMinutes = COMMENT_EDIT_WINDOW_MS / 1000 / 60;

    console.log(
      `Edit check for comment ${id}: created ${minutesSinceCreation} minutes ago, ` +
      `limit is ${editWindowMinutes} minutes`
    );

    if (timeSinceCreation > COMMENT_EDIT_WINDOW_MS) {
      console.warn(`Edit window expired for comment ${id}`);
      return null;
    }

    // Сохраняем старую версию в историю
    const historyStmt = db.prepare(`
      INSERT INTO comment_edits (comment_id, user_id, old_content)
      VALUES (?, ?, ?)
    `);
    historyStmt.run(id, userId, comment.content);

    // Обновляем комментарий
    const stmt = db.prepare(`
      UPDATE comments
      SET content = ?, edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(newContent, id);

    return getById(id);
  } catch (error) {
    console.error(`Error updating comment ${id}:`, error);
    throw error;
  }
}

/**
 * Скрыть комментарий (модерация)
 */
export function hide(id, hiddenByUserId, reason = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE comments
    SET is_hidden = 1, hidden_by = ?, hidden_at = CURRENT_TIMESTAMP, hidden_reason = ?
    WHERE id = ?
  `);
  stmt.run(hiddenByUserId, reason, id);
  return getById(id);
}

/**
 * Восстановить комментарий
 */
export function restore(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE comments
    SET is_hidden = 0, hidden_by = NULL, hidden_at = NULL, hidden_reason = NULL
    WHERE id = ?
  `);
  stmt.run(id);
  return getById(id);
}

/**
 * Удалить комментарий (мягкое удаление)
 */
export function remove(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE comments
    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(id);
  return getById(id);
}

/**
 * Получить историю редактирования комментария
 */
export function getEditHistory(commentId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT e.*, u.username as editor_username
    FROM comment_edits e
    JOIN users u ON e.user_id = u.id
    WHERE e.comment_id = ?
    ORDER BY e.edited_at DESC
  `);
  return stmt.all(commentId);
}

/**
 * Получить количество комментариев пользователя
 */
export function getCountByUserId(userId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM comments
    WHERE user_id = ? AND is_deleted = 0 AND is_hidden = 0
  `);
  const { count } = stmt.get(userId);
  return count;
}

/**
 * Получить последние комментарии пользователя
 */
export function getRecentByUserId(userId, limit = 10) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT c.*, n.title as news_title
    FROM comments c
    JOIN news n ON c.news_id = n.id
    WHERE c.user_id = ? AND c.is_deleted = 0 AND c.is_hidden = 0
    ORDER BY c.created_at DESC
    LIMIT ?
  `);
  return stmt.all(userId, limit);
}

/**
 * Проверить, может ли пользователь редактировать комментарий
 */
export function canEdit(comment, userId, userRole) {
  if (!comment) return false;
  if (comment.is_deleted) return false;
  
  // Владелец может редактировать в течение 10 минут
  if (comment.user_id === userId) {
    const createdAt = parseLocalDateTime(comment.created_at);
    const now = Date.now();
    return now - createdAt <= COMMENT_EDIT_WINDOW_MS;
  }
  
  // Админы и авторы не могут редактировать чужие комментарии
  return false;
}

/**
 * Проверить, может ли пользователь удалить комментарий
 */
export function canDelete(comment, userId, userRole) {
  if (!comment) return false;
  
  // Владелец может удалить свой комментарий
  if (comment.user_id === userId) {
    return true;
  }
  
  // Админы и авторы могут удалять любые комментарии
  if (userRole === 'admin' || userRole === 'author') {
    return true;
  }
  
  return false;
}

export default {
  create,
  getById,
  getByNewsId,
  update,
  hide,
  restore,
  remove,
  getEditHistory,
  getCountByUserId,
  getRecentByUserId,
  validateEmojiCount,
  canEdit,
  canDelete,
  COMMENT_EDIT_WINDOW_MS,
  MAX_EMOJIS
};



