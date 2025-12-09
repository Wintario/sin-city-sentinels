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

// POST /api/users - создать пользователя
router.post('/', usersController.create);

// PUT /api/users/:id - обновить пользователя
router.put('/:id', usersController.update);

// DELETE /api/users/:id - деактивировать пользователя
router.delete('/:id', usersController.remove);

export default router;
