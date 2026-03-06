import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import {
  uploadNewsImage,
  uploadHeaderImage,
  uploadNewsVideo,
  getVideoUploadStatus,
  deleteImage
} from '../controllers/uploadController.js';
import {
  uploadImage,
  uploadVideo,
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

// POST /api/upload/video - Р—Р°РіСЂСѓР·РёС‚СЊ РІРёРґРµРѕ РІ РЅРѕРІРѕСЃС‚СЊ (1 С„Р°Р№Р», РѕР±СЂР°Р±РѕС‚РєР° РІ РѕС‡РµСЂРµРґРё)
router.post(
  '/video',
  authenticate,
  requireRole(['admin', 'author']),
  writeLimiter,
  uploadVideo.single('video'),
  handleMulterError,
  uploadNewsVideo
);

// GET /api/upload/video/status/:jobId - РЎС‚Р°С‚СѓСЃ РѕР±СЂР°Р±РѕС‚РєРё РІРёРґРµРѕ
router.get(
  '/video/status/:jobId',
  authenticate,
  requireRole(['admin', 'author']),
  getVideoUploadStatus
);

// DELETE /api/upload/image/:filename - Удалить изображение
router.delete(
  '/image/:filename',
  authenticate,
  requireRole(['admin', 'author']),
  deleteImage
);

export default router;
