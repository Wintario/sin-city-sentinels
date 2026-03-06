import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as commentReportModel from '../models/commentReport.js';

const router = Router();

/**
 * GET /api/reports - Получить жалобы по статусу
 * Query: status (default: 'pending'), page (default: 1), limit (default: 20)
 * Только админы и авторы
 */
router.get('/',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const result = commentReportModel.getByStatus(
      status,
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
 * GET /api/reports/summary - Получить сводку по жалобам
 * Только админы и авторы
 */
router.get('/summary',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const summary = commentReportModel.getSummary();

    res.json({
      success: true,
      summary
    });
  })
);

/**
 * GET /api/reports/:id - Получить жалобу по ID
 * Только админы и авторы
 */
router.get('/:id',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const report = commentReportModel.getById(parseInt(id, 10));

    if (!report) {
      throw new ApiError(404, 'Жалоба не найдена');
    }

    res.json({
      success: true,
      report
    });
  })
);

/**
 * PATCH /api/reports/:id/status - Обновить статус жалобы
 * Только админы и авторы
 * Body: status ('pending', 'reviewed', 'resolved', 'rejected')
 */
router.patch('/:id/status',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Неверный статус');
    }

    const userId = req.user.id;
    const report = commentReportModel.updateStatus(parseInt(id, 10), status, userId);

    res.json({
      success: true,
      report
    });
  })
);

/**
 * POST /api/reports/:id/review - Рассмотреть жалобу
 * Только админы и авторы
 * Body: status ('resolved' или 'rejected'), reason (для resolved)
 */
router.post('/:id/review',
  authenticate,
  requireRole(['admin', 'author']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['resolved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Неверный статус');
    }

    if (status === 'resolved' && !reason) {
      throw new ApiError(400, 'Причина скрытия комментария обязательна');
    }

    const userId = req.user.id;
    const report = commentReportModel.review(parseInt(id, 10), status, userId, reason);

    res.json({
      success: true,
      report
    });
  })
);

export default router;
