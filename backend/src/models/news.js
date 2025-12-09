import { getDatabase } from '../db/db.js';
import logger from '../utils/logger.js';

/**
 * Генерация slug из заголовка
 */
function generateSlug(title) {
  const cyrillicToLatin = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  let slug = title.toLowerCase();
  slug = slug.split('').map(char => cyrillicToLatin[char] || char).join('');
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  slug = `${slug}-${Date.now()}`;
  
  return slug;
}

/**
 * Получить все опубликованные новости (публичный эндпоинт)
 * Только published_at != null И is_archived = 0
 */
export function getPublishedNews() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      n.id, n.title, n.slug, n.content, n.excerpt, n.image_url, n.published_at,
      u.username as author
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.published_at IS NOT NULL 
      AND n.published_at <= datetime('now')
      AND n.is_deleted = 0
      AND n.is_archived = 0
    ORDER BY n.published_at DESC
  `);
  return stmt.all();
}

/**
 * Получить одну опубликованную новость по ID
 */
export function getPublishedNewsById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      n.id, n.title, n.slug, n.content, n.excerpt, n.image_url, 
      n.published_at, n.created_at,
      u.username as author
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = ? 
      AND n.published_at IS NOT NULL 
      AND n.published_at <= datetime('now')
      AND n.is_deleted = 0
      AND n.is_archived = 0
  `);
  return stmt.get(id);
}

/**
 * Получить новости для админки с фильтром по архиву
 */
export function getAdminNewsList(archived = false) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      n.id, n.title, n.slug, n.excerpt, n.content, n.image_url,
      n.published_at, n.is_deleted, n.is_archived, n.created_at, n.updated_at,
      n.author_id, u.username as author
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.is_archived = ? AND n.is_deleted = 0
    ORDER BY COALESCE(n.published_at, n.created_at) DESC
  `);
  return stmt.all(archived ? 1 : 0);
}

/**
 * Получить все новости для админки (включая удалённые)
 */
export function getAllNewsAdmin() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      n.id, n.title, n.slug, n.excerpt, n.content, n.image_url,
      n.published_at, n.is_deleted, n.is_archived, n.created_at, n.updated_at,
      n.author_id, u.username as author
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.is_deleted = 0
    ORDER BY COALESCE(n.published_at, n.created_at) DESC
  `);
  return stmt.all();
}

/**
 * Получить новость по ID для админки
 */
export function getNewsById(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      n.*, u.username as author
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = ?
  `);
  return stmt.get(id);
}

/**
 * Создать новую новость
 */
export function createNews({ title, content, excerpt, image_url, published_at, author_id }) {
  const db = getDatabase();
  const slug = generateSlug(title);
  
  const stmt = db.prepare(`
    INSERT INTO news (title, slug, content, excerpt, image_url, published_at, author_id, is_archived)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);
  
  const result = stmt.run(title, slug, content, excerpt || null, image_url || null, published_at || null, author_id);
  logger.info(`News created: ${title}`, { id: result.lastInsertRowid, published: !!published_at });
  return getNewsById(result.lastInsertRowid);
}

/**
 * Обновить новость
 */
export function updateNews(id, { title, content, excerpt, image_url, published_at }) {
  const db = getDatabase();
  
  const current = getNewsById(id);
  if (!current) return null;
  
  let slug = current.slug;
  if (title && title !== current.title) {
    slug = generateSlug(title);
  }
  
  const stmt = db.prepare(`
    UPDATE news 
    SET 
      title = COALESCE(?, title),
      slug = ?,
      content = COALESCE(?, content),
      excerpt = COALESCE(?, excerpt),
      image_url = COALESCE(?, image_url),
      published_at = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    title || null,
    slug,
    content || null,
    excerpt,
    image_url,
    published_at !== undefined ? published_at : current.published_at,
    id
  );
  
  logger.info(`News updated: ${current.title}`, { id });
  
  return getNewsById(id);
}

/**
 * Опубликовать новость (установить published_at)
 */
export function publishNews(id) {
  const db = getDatabase();
  
  const current = getNewsById(id);
  if (!current) return null;
  
  const publishedAt = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE news 
    SET published_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(publishedAt, id);
  
  logger.info(`News published: ${current.title}`, { id, published_at: publishedAt });
  
  return getNewsById(id);
}

/**
 * Мягкое удаление новости
 */
export function deleteNews(id) {
  const db = getDatabase();
  const current = getNewsById(id);
  const stmt = db.prepare(`
    UPDATE news 
    SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(id);
  logger.info(`News deleted: ${current?.title}`, { id });
  return { success: true, message: 'News deleted' };
}

/**
 * Восстановить удалённую новость
 */
export function restoreNews(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE news 
    SET is_deleted = 0, is_archived = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(id);
  logger.info(`News restored`, { id });
  return getNewsById(id);
}

/**
 * Архивировать новость
 */
export function archiveNews(id) {
  const db = getDatabase();
  const current = getNewsById(id);
  const stmt = db.prepare(`
    UPDATE news 
    SET is_archived = 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(id);
  logger.info(`News archived: ${current?.title}`, { id });
  return getNewsById(id);
}

/**
 * Восстановить из архива
 */
export function unarchiveNews(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE news 
    SET is_archived = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(id);
  logger.info(`News unarchived`, { id });
  return getNewsById(id);
}

export default {
  getPublishedNews,
  getPublishedNewsById,
  getAdminNewsList,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  publishNews,
  deleteNews,
  restoreNews,
  archiveNews,
  unarchiveNews
};
