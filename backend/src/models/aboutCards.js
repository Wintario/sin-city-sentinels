import { getDatabase } from '../db/db.js';

/**
 * Получить все карточки отсортированные по order_index
 */
export function getAll() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM about_cards 
    ORDER BY order_index ASC, id ASC
  `);
  return stmt.all();
}

/**
 * Получить карточку по ID
 */
export function getById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM about_cards WHERE id = ?');
  return stmt.get(id);
}

/**
 * Создать новую карточку
 */
export function create(data) {
  const db = getDatabase();
  
  // Получаем максимальный order_index
  const maxStmt = db.prepare('SELECT MAX(order_index) as max_index FROM about_cards');
  const maxResult = maxStmt.get();
  const orderIndex = data.order_index ?? ((maxResult?.max_index ?? -1) + 1);
  
  const stmt = db.prepare(`
    INSERT INTO about_cards (title, description, image_url, style_type, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data.title,
    data.description,
    data.image_url || null,
    data.style_type || 'comic-thick-frame',
    orderIndex
  );
  
  return getById(result.lastInsertRowid);
}

/**
 * Обновить карточку
 */
export function update(id, data) {
  const db = getDatabase();
  
  const fields = [];
  const values = [];
  
  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(data.image_url);
  }
  if (data.style_type !== undefined) {
    fields.push('style_type = ?');
    values.push(data.style_type);
  }
  if (data.order_index !== undefined) {
    fields.push('order_index = ?');
    values.push(data.order_index);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE about_cards 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  return getById(id);
}

/**
 * Удалить карточку
 */
export function remove(id) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM about_cards WHERE id = ?');
  stmt.run(id);
}

/**
 * Изменить порядок карточки
 */
export function reorder(id, newIndex) {
  const db = getDatabase();
  const card = getById(id);
  
  if (!card) return null;
  
  const oldIndex = card.order_index;
  
  if (newIndex > oldIndex) {
    // Двигаем вниз: уменьшаем order_index у карточек между старой и новой позицией
    const stmt = db.prepare(`
      UPDATE about_cards 
      SET order_index = order_index - 1, updated_at = CURRENT_TIMESTAMP
      WHERE order_index > ? AND order_index <= ?
    `);
    stmt.run(oldIndex, newIndex);
  } else if (newIndex < oldIndex) {
    // Двигаем вверх: увеличиваем order_index у карточек между новой и старой позицией
    const stmt = db.prepare(`
      UPDATE about_cards 
      SET order_index = order_index + 1, updated_at = CURRENT_TIMESTAMP
      WHERE order_index >= ? AND order_index < ?
    `);
    stmt.run(newIndex, oldIndex);
  }
  
  // Устанавливаем новый order_index для карточки
  const updateStmt = db.prepare(`
    UPDATE about_cards 
    SET order_index = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updateStmt.run(newIndex, id);
  
  return getById(id);
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  reorder
};
