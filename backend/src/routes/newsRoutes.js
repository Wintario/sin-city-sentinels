import { Router } from 'express';
import {
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
} from '../controllers/newsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ============================================
// Публичные эндпоинты (без авторизации)
// ============================================

// GET /api/news - Все опубликованные новости (не архивированные)
router.get('/', getPublishedNews);

// ============================================
// Админские эндпоинты (требуют авторизации)
// ============================================

// GET /api/news/admin/list - Новости для админки (?archived=true|false)
router.get('/admin/list', authenticate, requireRole(['admin', 'author']), getAllNewsAdmin);

// GET /api/news/admin/:id - Одна новость для админки
router.get('/admin/:id', authenticate, requireRole(['admin', 'author']), getNewsById);

// POST /api/news - Создать новость
router.post('/', authenticate, requireRole(['admin', 'author']), writeLimiter, createNews);

// PUT /api/news/:id - Обновить новость
router.put('/:id', authenticate, requireRole(['admin', 'author']), writeLimiter, updateNews);

// PUT /api/news/:id/archive - Архивировать новость
router.put('/:id/archive', authenticate, requireRole(['admin', 'author']), archiveNews);

// PUT /api/news/:id/unarchive - Восстановить из архива
router.put('/:id/unarchive', authenticate, requireRole(['admin', 'author']), unarchiveNews);

// DELETE /api/news/:id - Удалить новость (мягкое удаление)
router.delete('/:id', authenticate, requireRole(['admin', 'author']), deleteNews);

// PATCH /api/news/:id/restore - Восстановить удалённую новость (только админ)
router.patch('/:id/restore', authenticate, requireRole('admin'), restoreNews);

// ============================================
// Публичный эндпоинт для одной новости
// ВАЖНО: Этот маршрут должен быть последним!
// ============================================

// GET /api/news/:id - Одна опубликованная новость
router.get('/:id', getPublishedNewsById);

export default router;
