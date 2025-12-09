import aboutCardsModel from '../models/aboutCards.js';

/**
 * Получить все карточки
 */
export async function getAll(req, res, next) {
  try {
    const cards = aboutCardsModel.getAll();
    res.json(cards);
  } catch (error) {
    next(error);
  }
}

/**
 * Получить карточку по ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const card = aboutCardsModel.getById(parseInt(id));
    
    if (!card) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }
    
    res.json(card);
  } catch (error) {
    next(error);
  }
}

/**
 * Создать карточку
 */
export async function create(req, res, next) {
  try {
    const { title, description, image_url, style_type, order_index } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Заголовок обязателен' });
    }
    
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Описание обязательно' });
    }
    
    const card = aboutCardsModel.create({
      title: title.trim(),
      description: description.trim(),
      image_url: image_url?.trim() || null,
      style_type: style_type || 'comic-thick-frame',
      order_index
    });
    
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
}

/**
 * Обновить карточку
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, image_url, style_type } = req.body;
    
    const existing = aboutCardsModel.getById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }
    
    const card = aboutCardsModel.update(parseInt(id), {
      title: title?.trim(),
      description: description?.trim(),
      image_url: image_url?.trim() || null,
      style_type
    });
    
    res.json(card);
  } catch (error) {
    next(error);
  }
}

/**
 * Удалить карточку
 */
export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    
    const existing = aboutCardsModel.getById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }
    
    aboutCardsModel.remove(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Изменить порядок карточки
 */
export async function reorder(req, res, next) {
  try {
    const { id } = req.params;
    const { order_index } = req.body;
    
    if (order_index === undefined || order_index < 0) {
      return res.status(400).json({ error: 'Некорректный индекс' });
    }
    
    const card = aboutCardsModel.reorder(parseInt(id), order_index);
    
    if (!card) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }
    
    res.json(card);
  } catch (error) {
    next(error);
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  reorder
};
