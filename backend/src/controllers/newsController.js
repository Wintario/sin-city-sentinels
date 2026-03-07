import * as NewsModel from '../models/news.js';
import { validateNewsInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * GET /api/news
 * РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹Рµ РЅРѕРІРѕСЃС‚Рё (РїСѓР±Р»РёС‡РЅС‹Р№)
 */
export const getPublishedNews = asyncHandler(async (req, res) => {
  const news = NewsModel.getPublishedNews();
  res.json(news);
});

/**
 * GET /api/news/:id
 * РџРѕР»СѓС‡РёС‚СЊ РѕРґРЅСѓ РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅСѓСЋ РЅРѕРІРѕСЃС‚СЊ (РїСѓР±Р»РёС‡РЅС‹Р№)
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
 * РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ РЅРѕРІРѕСЃС‚Рё РґР»СЏ Р°РґРјРёРЅРєРё
 */
export const getAllNewsAdmin = asyncHandler(async (req, res) => {
  const news = NewsModel.getAllNewsAdmin();
  res.json(news);
});

/**
 * GET /api/news/admin/:id
 * РџРѕР»СѓС‡РёС‚СЊ РЅРѕРІРѕСЃС‚СЊ РїРѕ ID РґР»СЏ Р°РґРјРёРЅРєРё
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
 * РЎРѕР·РґР°С‚СЊ РЅРѕРІСѓСЋ РЅРѕРІРѕСЃС‚СЊ
 */
export const createNews = asyncHandler(async (req, res) => {
  logger.request(req, 'Create news request');
  
  // Р’Р°Р»РёРґР°С†РёСЏ
  const validatedData = validateNewsInput(req.body);
  
  // Р”РѕР±Р°РІР»СЏРµРј author_id РёР· С‚РѕРєРµРЅР°
  validatedData.author_id = req.user.id;
  
  // РЎРѕР·РґР°С‘Рј РЅРѕРІРѕСЃС‚СЊ
  const news = NewsModel.createNews(validatedData);
  
  res.status(201).json(news);
});

/**
 * PUT /api/news/:id
 * РћР±РЅРѕРІРёС‚СЊ РЅРѕРІРѕСЃС‚СЊ
 * UPDATED: РўРµРїРµСЂСЊ РїРµСЂРµРґР°С‘С‚ updated_by
 */
export const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  logger.request(req, `Update news request for ID ${newsId}`);
  
  // РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј РїСЂР°РІР°: Р°РґРјРёРЅ РјРѕР¶РµС‚ РІСЃС‘, Р°РІС‚РѕСЂ вЂ” С‚РѕР»СЊРєРѕ СЃРІРѕРё
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    throw new ApiError(403, 'You can only edit your own news');
  }
  
  // Р’Р°Р»РёРґР°С†РёСЏ
  const validatedData = validateNewsInput(req.body, true);
  
  // Р”РѕР±Р°РІР»СЏРµРј updated_by (РєС‚Рѕ СЂРµРґР°РєС‚РёСЂСѓРµС‚)
  validatedData.updated_by = req.user.id;
  
  // РћР±РЅРѕРІР»СЏРµРј
  const news = NewsModel.updateNews(newsId, validatedData);
  
  res.json(news);
});

/**
 * DELETE /api/news/:id
 * РњСЏРіРєРѕРµ СѓРґР°Р»РµРЅРёРµ РЅРѕРІРѕСЃС‚Рё
 */
export const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  // РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  // РџСЂРѕРІРµСЂСЏРµРј РїСЂР°РІР°: Р°РґРјРёРЅ РјРѕР¶РµС‚ РІСЃС‘, Р°РІС‚РѕСЂ вЂ” С‚РѕР»СЊРєРѕ СЃРІРѕРё
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    throw new ApiError(403, 'You can only delete your own news');
  }
  
  const result = NewsModel.deleteNews(newsId);
  res.json(result);
});

/**
 * PATCH /api/news/:id/restore
 * Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ СѓРґР°Р»С‘РЅРЅСѓСЋ РЅРѕРІРѕСЃС‚СЊ (С‚РѕР»СЊРєРѕ Р°РґРјРёРЅ)
 */
export const restoreNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);
  
  // РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ
  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }
  
  const news = NewsModel.restoreNews(newsId);
  res.json(news);
});

/**
 * PUT /api/news/:id/publish
 * РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ РЅРѕРІРѕСЃС‚СЊ (СѓСЃС‚Р°РЅРѕРІРёС‚СЊ published_at)
 * РќР• РўР Р•Р‘РЈР•Рў title/content - РѕР±РЅРѕРІР»СЏРµС‚ С‚РѕР»СЊРєРѕ published_at
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

  // РџСЂРѕРІРµСЂСЏРµРј РїСЂР°РІР°: Р°РґРјРёРЅ РјРѕР¶РµС‚ РІСЃС‘, Р°РІС‚РѕСЂ вЂ” С‚РѕР»СЊРєРѕ СЃРІРѕРё
  if (req.user.role !== 'admin' && existingNews.author_id !== req.user.id) {
    logger.error(`Unauthorized publish attempt for news ${newsId}`, { user: req.user });
    throw new ApiError(403, 'You can only publish your own news');
  }

  // РСЃРїРѕР»СЊР·СѓРµРј СЃРїРµС†РёР°Р»СЊРЅС‹Р№ РјРµС‚РѕРґ РґР»СЏ РїСѓР±Р»РёРєР°С†РёРё
  const news = NewsModel.publishNews(newsId);

  logger.info(`News published successfully: ${newsId}`, { title: news.title });

  res.json(news);
});

/**
 * POST /api/news/:id/move-up
 * РџРµСЂРµРјРµСЃС‚РёС‚СЊ РЅРѕРІРѕСЃС‚СЊ РІРІРµСЂС…
 */
export const moveNewsUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);

  logger.info(`Move up news request for ID ${newsId}`, { user: req.user?.username });

  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }

  const news = NewsModel.moveNewsUp(newsId);
  if (!news) {
    return res.json({ success: false, message: 'Already at top' });
  }

  res.json({ success: true, news });
});

/**
 * POST /api/news/:id/move-down
 * РџРµСЂРµРјРµСЃС‚РёС‚СЊ РЅРѕРІРѕСЃС‚СЊ РІРЅРёР·
 */
export const moveNewsDown = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newsId = parseInt(id, 10);

  logger.info(`Move down news request for ID ${newsId}`, { user: req.user?.username });

  const existingNews = NewsModel.getNewsById(newsId);
  if (!existingNews) {
    throw new ApiError(404, 'News not found');
  }

  const news = NewsModel.moveNewsDown(newsId);
  if (!news) {
    return res.json({ success: false, message: 'Already at bottom' });
  }

  res.json({ success: true, news });
});

export default {
  getPublishedNews,
  getPublishedNewsById,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  moveNewsUp,
  moveNewsDown,
  deleteNews,
  restoreNews,
  publishNews
};

