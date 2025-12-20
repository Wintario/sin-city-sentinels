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
 * Сортировка по display_order (если установлен) или по published_at
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
      AND n.is_deleted = 0
    ORDER BY COALESCE(n.display_order, 9999) ASC, n.published_at DESC
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
      AND n.is_deleted = 0
  `);
  return stmt.get(id);
}

/**
 * Получить все новости для админки
 * Сортировка по display_order (для drag-and-drop), потом по published_at
 */
export function getAllNewsAdmin() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      n.id, n.title, n.slug, n.excerpt, n.content, n.image_url,
      n.published_at, n.is_deleted, n.created_at, n.updated_at, n.updated_by, n.display_order,
      n.author_id, 
      u.username as author,
      u2.username as updated_by_username
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN users u2 ON n.updated_by = u2.id
    WHERE n.is_deleted = 0
    ORDER BY COALESCE(n.display_order, 9999) ASC, n.published_at DESC
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
      n.*, 
      u.username as author,
      u2.username as updated_by_username
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN users u2 ON n.updated_by = u2.id
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
  
  // Получаем максимальный display_order
  const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM news WHERE is_deleted = 0').get();
  const display_order = (maxOrder.max || 0) + 1;
  
  const stmt = db.prepare(`
    INSERT INTO news (title, slug, content, excerpt, image_url, published_at, author_id, updated_by, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    title, 
    slug, 
    content, 
    excerpt || null, 
    image_url || null, 
    published_at || null, 
    author_id,
    author_id,
    display_order
  );
  
  logger.info(`News created: ${title}`, { id: result.lastInsertRowid, published: !!published_at, display_order });
  return getNewsById(result.lastInsertRowid);
}

/**
 * Обновить новость
 * ВАЖНО: published_at НЕ меняется при редактировании!
 * Сохраняет updated_by (кто последний редактировал)
 */
export function updateNews(id, { title, content, excerpt, image_url, published_at, updated_by }) {
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
      image_url = ?,
      published_at = ?,
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    title || null,
    slug,
    content || null,
    excerpt || null,
    image_url !== undefined ? image_url : current.image_url,
    published_at !== undefined ? published_at : current.published_at,
    updated_by || current.updated_by,
    id
  );
  
  logger.info(`News updated: ${current.title}`, { id, updated_by });
  
  return getNewsById(id);
}

/**
 * Переупорядочить новости (drag-and-drop в админке)
 * Устанавливает display_order для группы новостей
 */
export function reorderNews(newsIds) {
  const db = getDatabase();
  
  try {
    const stmt = db.prepare(`UPDATE news SET display_order = ? WHERE id = ?`);
    
    newsIds.forEach((id, index) => {
      stmt.run(index + 1, id);
    });
    
    logger.info(`News reordered`, { count: newsIds.length });
    return { success: true, message: 'News reordered' };
  } catch (error) {
    logger.error('Reorder error:', error);
    return { success: false, error: error.message };
  }
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
    SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(id);
  logger.info(`News restored`, { id });
  return getNewsById(id);
}

export default {
  getPublishedNews,
  getPublishedNewsById,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  reorderNews,
  publishNews,
  deleteNews,
  restoreNews
};