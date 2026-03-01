import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import {
  uploadNewsImage,
  uploadHeaderImage,
  deleteImage
} from '../controllers/uploadController.js';
import {
  uploadImage,
  uploadHeaderImage as uploadHeaderMiddleware,
  handleMulterError
} from '../middleware/uploadValidator.js';

const router = Router();

// ============================================
// Эндпоинты загрузки изображений
// Требуют авторизации (admin или author)
// ============================================

// POST /api/upload/image - Загрузить изображения в контент новости (до 5 файлов)
router.post(
  '/image',
  authenticate,
  requireRole(['admin', 'author']),
  writeLimiter,
  uploadImage.array('images', 5),
  handleMulterError,
  uploadNewsImage
);

// POST /api/upload/header-image - Загрузить изображение шапки новости (1 файл)
router.post(
  '/header-image',
  authenticate,
  requireRole(['admin', 'author']),
  writeLimiter,
  uploadHeaderMiddleware.single('image'),
  handleMulterError,
  uploadHeaderImage
);

// DELETE /api/upload/image/:filename - Удалить изображение
router.delete(
  '/image/:filename',
  authenticate,
  requireRole(['admin', 'author']),
  deleteImage
);

export default router;
