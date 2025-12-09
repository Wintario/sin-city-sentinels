import * as NewsModel from '../models/news.js';
import { validateNewsInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

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
 */
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
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
  
  // Обновляем
  const news = NewsModel.updateNews(newsId, validatedData);
  
  res.json(news);
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
 * PATCH /api/news/:id/archive
 * Архивировать новость
 */
export const archiveNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  // Проверяем права: админ может всё, автор — только свои
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    throw new ApiError(403, 'You can only archive your own news');
  }
  
  const news = NewsModel.archiveNews(newsId);
  res.json(news);
});

/**
 * PATCH /api/news/:id/unarchive
 * Разархивировать новость
 */
export const unarchiveNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  // Проверяем права: админ может всё, автор — только свои
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    throw new ApiError(403, 'You can only unarchive your own news');
  }
  
  const news = NewsModel.unarchiveNews(newsId);
  res.json(news);
});

export default {
  getPublishedNews,
  getPublishedNewsById,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  restoreNews,
  archiveNews,
  unarchiveNews
};
