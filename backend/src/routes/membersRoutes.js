import { Router } from 'express';
import {
  getActiveMembers,
  getMemberById,
  getAllMembersAdmin,
  createMember,
  updateMember,
  deleteMember,
  reorderMember
} from '../controllers/membersController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ============================================
// Публичные эндпоинты (без авторизации)
// ============================================

// GET /api/members - Все активные участники
router.get('/', getActiveMembers);

// ============================================
// Админские эндпоинты (требуют авторизации)
// ============================================

// GET /api/members/admin/list - Все участники для админки
router.get('/admin/list', authenticate, requireRole(['admin', 'author']), getAllMembersAdmin);

// POST /api/members - Создать участника
router.post('/', authenticate, requireRole(['admin', 'author']), writeLimiter, createMember);

// PUT /api/members/:id - Обновить участника
router.put('/:id', authenticate, requireRole(['admin', 'author']), writeLimiter, updateMember);

// DELETE /api/members/:id - Удалить участника
router.delete('/:id', authenticate, requireRole(['admin', 'author']), deleteMember);

// PATCH /api/members/:id/reorder - Изменить порядок
router.patch('/:id/reorder', authenticate, requireRole(['admin', 'author']), reorderMember);

// ============================================
// Публичный эндпоинт для одного участника
// ============================================

// GET /api/members/:id - Один участник
router.get('/:id', getMemberById);

export default router;
