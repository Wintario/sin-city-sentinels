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
 * Сортировка по id DESC (новые сверху)
 */
export function getPublishedNews() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      n.id, n.title, n.slug, n.content, n.excerpt, n.image_url, n.header_image_meta,
      n.published_at,
      u.username as author
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.published_at IS NOT NULL
      AND n.is_deleted = 0
    ORDER BY n.id DESC
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
      n.id, n.title, n.slug, n.content, n.excerpt, n.image_url, n.header_image_meta,
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
 * Сортировка по id DESC (новые сверху)
 */
export function getAllNewsAdmin() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      n.id, n.title, n.slug, n.excerpt, n.content, n.image_url, n.header_image_meta,
      n.published_at, n.is_deleted, n.created_at, n.updated_at, n.updated_by,
      n.author_id,
      u.username as author,
      u2.username as updated_by_username
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    LEFT JOIN users u2 ON n.updated_by = u2.id
    WHERE n.is_deleted = 0
    ORDER BY n.id DESC
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
export function createNews({ title, content, excerpt, image_url, header_image_meta, published_at, author_id }) {
  const db = getDatabase();
  const slug = generateSlug(title);

  const stmt = db.prepare(`
    INSERT INTO news (title, slug, content, excerpt, image_url, header_image_meta, published_at, author_id, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    title,
    slug,
    content,
    excerpt || null,
    image_url || null,
    header_image_meta || null,
    published_at || null,
    author_id,
    author_id
  );

  logger.info(`News created: ${title}`, { id: result.lastInsertRowid, published: !!published_at });
  return getNewsById(result.lastInsertRowid);
}

/**
 * Обновить новость
 * ВАЖНО: published_at НЕ меняется при редактировании!
 * Сохраняет updated_by (кто последний редактировал)
 */
export function updateNews(id, { title, content, excerpt, image_url, header_image_meta, published_at, updated_by }) {
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
      header_image_meta = ?,
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
    header_image_meta !== undefined ? header_image_meta : current.header_image_meta,
    published_at !== undefined ? published_at : current.published_at,
    updated_by || current.updated_by,
    id
  );
  
  logger.info(`News updated: ${current.title}`, { id, updated_by });
  
  return getNewsById(id);
}

/**
 * Переместить новость вверх (увеличить id для перемещения вверх списка)
 * Меняем id местами с предыдущей новостью (с меньшим id)
 */
export function moveNewsUp(id) {
  const db = getDatabase();
  
  const news = getNewsById(id);
  if (!news) return null;
  
  // Для списка id DESC "вверх" = к большему id
  const upperNews = db.prepare('SELECT id FROM news WHERE id > ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1').get(id);
  if (!upperNews) return null; // Уже первая

  // Меняем id местами через временную таблицу
  swapNewsIds(db, id, upperNews.id);

  logger.info(`News moved up: ${news.title}`, { id, swapped_with: upperNews.id });
  return getNewsById(upperNews.id);
}

/**
 * Переместить новость вниз (уменьшить id для перемещения вниз списка)
 * Меняем id местами со следующей новостью (с большим id)
 */
export function moveNewsDown(id) {
  const db = getDatabase();
  
  const news = getNewsById(id);
  if (!news) return null;
  
  // Для списка id DESC "вниз" = к меньшему id
  const lowerNews = db.prepare('SELECT id FROM news WHERE id < ? AND is_deleted = 0 ORDER BY id DESC LIMIT 1').get(id);
  if (!lowerNews) return null; // Уже последняя

  // Меняем id местами через временную таблицу
  swapNewsIds(db, id, lowerNews.id);

  logger.info(`News moved down: ${news.title}`, { id, swapped_with: lowerNews.id });
  return getNewsById(lowerNews.id);
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

function swapNewsIds(db, sourceId, targetId) {
  const tempId = -Math.floor(Date.now() % 1000000000) - 1;

  const hasTable = (tableName) => {
    const result = db.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?"
    ).get(tableName);
    return !!result;
  };

  const swapTx = db.transaction(() => {
    db.exec(`
      CREATE TEMPORARY TABLE IF NOT EXISTS news_id_swap (
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        temp_id INTEGER NOT NULL
      );
      DELETE FROM news_id_swap;
    `);

    db.prepare(
      'INSERT INTO news_id_swap (source_id, target_id, temp_id) VALUES (?, ?, ?)'
    ).run(sourceId, targetId, tempId);

    db.prepare('UPDATE news SET id = ? WHERE id = ?').run(tempId, sourceId);
    db.prepare('UPDATE news SET id = ? WHERE id = ?').run(sourceId, targetId);
    db.prepare('UPDATE news SET id = ? WHERE id = ?').run(targetId, tempId);

    if (hasTable('comments')) {
      db.prepare('UPDATE comments SET news_id = ? WHERE news_id = ?').run(tempId, sourceId);
      db.prepare('UPDATE comments SET news_id = ? WHERE news_id = ?').run(sourceId, targetId);
      db.prepare('UPDATE comments SET news_id = ? WHERE news_id = ?').run(targetId, tempId);
    }

    if (hasTable('page_views')) {
      db.prepare("UPDATE page_views SET page_id = ? WHERE page_type = 'news' AND page_id = ?").run(tempId, sourceId);
      db.prepare("UPDATE page_views SET page_id = ? WHERE page_type = 'news' AND page_id = ?").run(sourceId, targetId);
      db.prepare("UPDATE page_views SET page_id = ? WHERE page_type = 'news' AND page_id = ?").run(targetId, tempId);
    }

    db.exec('DELETE FROM news_id_swap');
  });

  db.exec('PRAGMA foreign_keys = OFF');
  try {
    swapTx();
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

export default {
  getPublishedNews,
  getPublishedNewsById,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  moveNewsUp,
  moveNewsDown,
  publishNews,
  deleteNews,
  restoreNews
};
