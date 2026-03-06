import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import usersController from '../controllers/usersController.js';

const router = Router();

// Все роуты требуют аутентификации и роли admin
router.use(authenticate);
router.use(requireRole(['admin']));

// GET /api/users - список всех пользователей
router.get('/', usersController.getAll);

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', usersController.getById);

// GET /api/users/:id/ban - получить информацию о бане
router.get('/:id/ban', usersController.getBanInfo);

// POST /api/users - создать пользователя
router.post('/', usersController.create);

// PUT /api/users/:id - обновить пользователя
router.put('/:id', usersController.update);

// POST /api/users/:id/ban - забанить пользователя
router.post('/:id/ban', usersController.ban);

// POST /api/users/:id/unban - разбанить пользователя
router.post('/:id/unban', usersController.unban);

// DELETE /api/users/:id - удалить пользователя навсегда
router.delete('/:id', usersController.permanentDelete);

// POST /api/users/:id/reset-password - сброс пароля
router.post('/:id/reset-password', usersController.resetPassword);

export default router;
