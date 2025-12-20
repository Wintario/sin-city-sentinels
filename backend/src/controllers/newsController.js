import * as NewsModel from '../models/news.js';
import { validateNewsInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * GET /api/news
 * Получить все опубликованные новости (публичный)
 */
export const getPublishedNews = asyncHandler(async (req, res) => {
  const news = NewsModel.getPublishedNews();
  res.json(news);
});

/**
 * GET /api/news/:id
 * Получить одну опубликованную новость (публичный)
 */
export const getPublishedNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const news = NewsModel.getPublishedNewsById(parseInt(id, 10));
  
  if (!news) {
    throw new ApiError(404, 'News not found');
  }
  
  res.json(news);
});

/**
 * GET /api/news/admin/list
 * Получить все новости для админки
 */
export const getAllNewsAdmin = asyncHandler(async (req, res) => {
  const news = NewsModel.getAllNewsAdmin();
  res.json(news);
});

/**
 * GET /api/news/admin/:id
 * Получить новость по ID для админки
 */
export const getNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const news = NewsModel.getNewsById(parseInt(id, 10));
  
  if (!news) {
    throw new ApiError(404, 'News not found');
  }
  
  res.json(news);
});

/**
 * POST /api/news
 * Создать новую новость
 */
export const createNews = asyncHandler(async (req, res) => {
  logger.request(req, 'Create news request');
  
  // Валидация
  const validatedData = validateNewsInput(req.body);
  
  // Добавляем author_id из токена
  validatedData.author_id = req.user.id;
  
  // Создаём новость
  const news = NewsModel.createNews(validatedData);
  
  res.status(201).json(news);
});

/**
 * PUT /api/news/:id
 * Обновить новость
 * UPDATED: Теперь передаёт updated_by
 */
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  logger.request(req, `Update news request for ID ${newsId}`);
  
  // Проверяем существование
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  // Проверяем права: админ может всё, автор — только свои
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    throw new ApiError(403, 'You can only edit your own news');
  }
  
  // Валидация
  const validatedData = validateNewsInput(req.body, true);
  
  // Добавляем updated_by (кто редактирует)
  validatedData.updated_by = req.user.id;
  
  // Обновляем
  const news = NewsModel.updateNews(newsId, validatedData);
  
  res.json(news);
});

/**
 * POST /api/news/admin/reorder
 * Переупорядочить новости (drag-and-drop)
 * Body: { newsIds: [1, 3, 2, 4] }
 */
export const reorderNews = asyncHandler(async (req, res) => {
  const { newsIds } = req.body;
  
  logger.info('Reorder request', { newsIds, user: req.user?.username });
  
  if (!Array.isArray(newsIds) || newsIds.length === 0) {
    logger.warn('Invalid reorder request - newsIds not array or empty', { newsIds });
    throw new ApiError(400, 'newsIds must be a non-empty array');
  }
  
  logger.request(req, `Reorder news: ${newsIds.length} items`);
  
  try {
    const result = NewsModel.reorderNews(newsIds);
    
    if (!result.success) {
      logger.error('Reorder failed', { error: result.error, newsIds });
      throw new ApiError(500, result.error);
    }
    
    // Возвращаем обновленный список
    const news = NewsModel.getAllNewsAdmin();
    res.json({ success: true, message: result.message, news });
  } catch (error) {
    logger.error('Reorder exception:', { error: error.message, newsIds });
    throw new ApiError(500, `Reorder error: ${error.message}`);
  }
});

/**
 * DELETE /api/news/:id
 * Мягкое удаление новости
 */
export const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  // Проверяем существование
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  // Проверяем права: админ может всё, автор — только свои
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    throw new ApiError(403, 'You can only delete your own news');
  }
  
  const result = NewsModel.deleteNews(newsId);
  res.json(result);
});

/**
 * PATCH /api/news/:id/restore
 * Восстановить удалённую новость (только админ)
 */
export const restoreNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  // Проверяем существование
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  const news = NewsModel.restoreNews(newsId);
  res.json(news);
});

/**
 * PUT /api/news/:id/publish
 * Опубликовать новость (установить published_at)
 * НЕ ТРЕБУЕТ title/content - обновляет только published_at
 */
export const publishNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  logger.info(`Publish news request for ID ${newsId}`, { user: req.user?.username });
  
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    logger.error(`News not found for publish: ${newsId}`);
    throw new ApiError(404, 'News not found');
  }
  
  // Проверяем права: админ может всё, автор — только свои
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    logger.error(`Unauthorized publish attempt for news ${newsId}`, { user: req.user });
    throw new ApiError(403, 'You can only publish your own news');
  }
  
  // Используем специальный метод для публикации
  const news = NewsModel.publishNews(newsId);
  
  logger.info(`News published successfully: ${newsId}`, { title: news.title });
  
  res.json(news);
});

export default {
  getPublishedNews,
  getPublishedNewsById,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  reorderNews,
  deleteNews,
  restoreNews,
  publishNews
};