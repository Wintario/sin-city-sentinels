/**
 * Дополнительные endpoints для админ-панели
 * Добавляют функционал для управления комментариями и жалобами
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getDatabase } from '../db/db.js';
import * as commentModel from '../models/comment.js';
import * as commentReportModel from '../models/commentReport.js';
import { hasAdminOrAuthorRole } from '../models/user.js';

const router = Router();

// Все маршруты требуют авторизации и роли admin/author
router.use(authenticate);
router.use(requireRole(['admin', 'author']));

/**
 * GET /api/comments/admin/all - Получить все комментарии с фильтрами и пагинацией
 * Query: page, limit, status (all/hidden/deleted), newsId, userId, search
 */
router.get('/admin/all',
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      status = 'all',
      newsId,
      userId,
      search,
    } = req.query;

    const db = getDatabase();
    const offset = (page - 1) * limit;

    // Строим динамический запрос
    let whereClauses = [];
    let params = [];

    // Фильтр по статусу
    if (status === 'hidden') {
      whereClauses.push('c.is_hidden = 1');
    } else if (status === 'deleted') {
      whereClauses.push('c.is_deleted = 1');
    } else {
      whereClauses.push('c.is_deleted = 0');
    }

    // Фильтр по новости
    if (newsId) {
      whereClauses.push('c.news_id = ?');
      params.push(parseInt(newsId, 10));
    }

    // Фильтр по пользователю
    if (userId) {
      whereClauses.push('c.user_id = ?');
      params.push(parseInt(userId, 10));
    }

    // Поиск по тексту
    if (search) {
      whereClauses.push('c.content LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Получаем комментарии
    const stmt = db.prepare(`
      SELECT c.id,
             c.news_id,
             c.user_id,
             c.parent_id,
             c.content,
             c.is_deleted,
             c.is_hidden,
             c.hidden_by,
             c.hidden_at,
             c.hidden_reason,
             c.edited_at,
             c.created_at,
             u.username as author_username,
             p.arena_nickname as author_arena_nickname,
             p.character_url as author_character_url,
             p.character_level as author_character_level,
             p.race_code as author_race_code,
             p.race_class as author_race_class,
             p.race_title as author_race_title,
             p.race_style as author_race_style,
             p.clan_name as author_clan_name,
             p.clan_url as author_clan_url,
             p.clan_icon as author_clan_icon
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles p ON c.user_id = p.user_id
      ${whereSQL}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const comments = stmt.all(...params, parseInt(limit, 10), offset);

    // Получаем общее количество
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM comments c
      ${whereSQL}
    `);
    const { count } = countStmt.get(...params);

    // Для каждого комментария получаем количество жалоб
    const commentsWithReports = comments.map((comment) => {
      const reportsStmt = db.prepare(`
        SELECT COUNT(*) as count FROM comment_reports WHERE comment_id = ?
      `);
      const { count: reportsCount } = reportsStmt.get(comment.id);
      return {
        ...comment,
        reports_count: reportsCount,
      };
    });

    res.json({
      success: true,
      comments: commentsWithReports,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  })
);

/**
 * GET /api/comments/admin/:id/context - Получить комментарий с контекстом (новость)
 */
router.get('/admin/:id/context',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const comment = commentModel.getById(parseInt(id, 10));

    if (!comment) {
      throw new ApiError(404, 'Комментарий не найден');
    }

    // Получаем новость
    const newsStmt = getDatabase().prepare(`
      SELECT id, title, slug FROM news WHERE id = ?
    `);
    const news = newsStmt.get(comment.news_id);

    // Получаем все жалобы на этот комментарий
    const reportsStmt = getDatabase().prepare(`
      SELECT r.*, u.username as reporter_username
      FROM comment_reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.comment_id = ?
      ORDER BY r.created_at DESC
    `);
    const reports = reportsStmt.all(comment.id);

    res.json({
      success: true,
      comment,
      news,
      reports,
    });
  })
);

/**
 * POST /api/comments/admin/bulk-action - Массовые операции с комментариями
 * Body: ids (array), action (hide/restore/delete)
 */
router.post('/admin/bulk-action',
  asyncHandler(async (req, res) => {
    const { ids, action, reason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, 'Необходимо указать массив ID комментариев');
    }

    if (!['hide', 'restore', 'delete'].includes(action)) {
      throw new ApiError(400, 'Недопустимое действие');
    }

    const db = getDatabase();
    const userId = req.user.id;
    const results = [];

    // Выполняем действие для каждого комментария
    for (const id of ids) {
      try {
        let result;

        if (action === 'hide') {
          const stmt = db.prepare(`
            UPDATE comments
            SET is_hidden = 1, hidden_by = ?, hidden_at = CURRENT_TIMESTAMP, hidden_reason = ?
            WHERE id = ?
          `);
          stmt.run(userId, reason || 'Скрыто администратором', id);
          result = { id, success: true, action: 'hidden' };
        } else if (action === 'restore') {
          const stmt = db.prepare(`
            UPDATE comments
            SET is_hidden = 0, hidden_by = NULL, hidden_at = NULL, hidden_reason = NULL
            WHERE id = ?
          `);
          stmt.run(id);
          result = { id, success: true, action: 'restored' };
        } else if (action === 'delete') {
          const stmt = db.prepare(`
            UPDATE comments
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);
          stmt.run(id);
          result = { id, success: true, action: 'deleted' };
        }

        results.push(result);
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      results,
      total: ids.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  })
);

/**
 * GET /api/comments/admin/:id/history - Получить историю редактирования (для админки)
 */
router.get('/admin/:id/history',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const history = commentModel.getEditHistory(parseInt(id, 10));

    res.json({
      success: true,
      history,
    });
  })
);

/**
 * GET /api/comments/admin/user/:userId/stats - Статистика комментариев пользователя
 */
router.get('/admin/user/:userId/stats',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const db = getDatabase();

    // Общее количество комментариев
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as count FROM comments
      WHERE user_id = ? AND is_deleted = 0
    `);
    const { count: totalComments } = totalStmt.get(parseInt(userId, 10));

    // Количество скрытых комментариев
    const hiddenStmt = db.prepare(`
      SELECT COUNT(*) as count FROM comments
      WHERE user_id = ? AND is_hidden = 1 AND is_deleted = 0
    `);
    const { count: hiddenComments } = hiddenStmt.get(parseInt(userId, 10));

    // Количество жалоб на комментарии пользователя
    const reportsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM comment_reports cr
      JOIN comments c ON cr.comment_id = c.id
      WHERE c.user_id = ?
    `);
    const { count: totalReports } = reportsStmt.get(parseInt(userId, 10));

    // Последние комментарии
    const recentStmt = db.prepare(`
      SELECT c.id, c.content, c.created_at, c.is_hidden, c.is_deleted,
             (SELECT COUNT(*) FROM comment_reports WHERE comment_id = c.id) as reports_count
      FROM comments c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `);
    const recentComments = recentStmt.all(parseInt(userId, 10));

    res.json({
      success: true,
      stats: {
        totalComments,
        hiddenComments,
        totalReports,
      },
      recentComments,
    });
  })
);

/**
 * POST /api/comments/admin/user/:userId/hide-all - Скрыть все комментарии пользователя
 */
router.post('/admin/user/:userId/hide-all',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { reason } = req.body;

    const db = getDatabase();
    const adminId = req.user.id;

    const stmt = db.prepare(`
      UPDATE comments
      SET is_hidden = 1, hidden_by = ?, hidden_at = CURRENT_TIMESTAMP, hidden_reason = ?
      WHERE user_id = ? AND is_hidden = 0 AND is_deleted = 0
    `);

    const { changes } = stmt.run(adminId, reason || 'Скрыто администратором (массовая операция)', parseInt(userId, 10));

    res.json({
      success: true,
      hidden: changes,
    });
  })
);

/**
 * GET /api/reports/admin/summary - Сводка по жалобам для дашборда
 */
router.get('/admin/summary',
  asyncHandler(async (req, res) => {
    const summary = commentReportModel.getSummary();

    res.json({
      success: true,
      summary,
    });
  })
);

export default router;
