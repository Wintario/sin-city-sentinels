import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { commentLimiter, reportLimiter } from '../middleware/rateLimiter.js';
import {
  validateCommentMiddleware,
  validateUpdateCommentMiddleware,
  validateReportMiddleware
} from '../middleware/validateComment.js';
import * as commentModel from '../models/comment.js';
import * as commentReportModel from '../models/commentReport.js';
import { hasAdminOrAuthorRole } from '../models/user.js';

const router = Router();

/**
 * GET /api/comments - Получить комментарии к новости
 * Query: newsId (required), page (default: 1), limit (default: 20)
 */
router.get('/',
  asyncHandler(async (req, res) => {
    const { newsId, page = 1, limit = 20 } = req.query;

    if (!newsId) {
      throw new ApiError(400, 'newsId обязателен');
    }

    const result = commentModel.getByNewsId(
      parseInt(newsId, 10),
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    res.json({
      success: true,
      ...result
    });
  })
);

/**
 * POST /api/comments - Создать комментарий
 * Требует авторизации
 * Body: newsId, content, parentId (optional)
 */
router.post('/',
  authenticate,
  commentLimiter,
  validateCommentMiddleware,
  asyncHandler(async (req, res) => {
    const { newsId, content, parentId } = req.validatedBody;
    const userId = req.user.id;

    // Проверяем верификацию пользователя
    const { getProfileByUserId } = await import('../models/userProfile.js');
    const profile = getProfileByUserId(userId);

    if (!profile || !profile.email_verified) {
      throw new ApiError(403, 'Требуется верификация для комментирования. Разместите токен в профиле персонажа.');
    }

    const comment = commentModel.create(newsId, userId, content, parentId || null);

    res.status(201).json({
      success: true,
      comment
    });
  })
);

/**
 * PUT /api/comments/:id - Обновить комментарий (в течение 10 минут)
 * Только владелец комментария
 */
router.put('/:id',
  authenticate,
  validateUpdateCommentMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.validatedBody;
    const userId = req.user.id;

    const comment = commentModel.update(parseInt(id, 10), userId, content);

    if (!comment) {
      throw new ApiError(400, 'Не удалось обновить комментарий (возможно, прошло больше 1 часа)');
    }

    res.json({
      success: true,
      comment
    });
  })
);

/**
 * DELETE /api/comments/:id - Удалить комментарий
 * Только владелец или админ/автор
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const comment = commentModel.getById(parseInt(id, 10));
    if (!comment) {
      throw new ApiError(404, 'Комментарий не найден');
    }

    // Проверка прав
    if (!commentModel.canDelete(comment, userId, userRole)) {
      throw new ApiError(403, 'Недостаточно прав для удаления');
    }

    const deleted = commentModel.remove(parseInt(id, 10));

    res.json({
      success: true,
      comment: deleted
    });
  })
);

/**
 * PATCH /api/comments/:id/hide - Скрыть комментарий
 * Только авторы и админы
 */
router.patch('/:id/hide',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const comment = commentModel.hide(parseInt(id, 10), userId, reason || null);

    res.json({
      success: true,
      comment
    });
  })
);

/**
 * PATCH /api/comments/:id/restore - Восстановить комментарий
 * Только админы и авторы
 */
router.patch('/:id/restore',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const comment = commentModel.restore(parseInt(id, 10));

    res.json({
      success: true,
      comment
    });
  })
);

/**
 * GET /api/comments/:id/history - История редактирования
 * Только админы
 */
router.get('/:id/history',
  authenticate,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const history = commentModel.getEditHistory(parseInt(id, 10));

    res.json({
      success: true,
      history
    });
  })
);

/**
 * POST /api/comments/:id/report - Создать жалобу на комментарий
 */
router.post('/:id/report',
  authenticate,
  reportLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.length < 10) {
      throw new ApiError(400, 'Причина должна быть не менее 10 символов');
    }

    const result = commentReportModel.create(parseInt(id, 10), userId, reason);

    if (result.error) {
      throw new ApiError(400, result.error);
    }

    res.status(201).json({
      success: true,
      report: result
    });
  })
);

export default router;
