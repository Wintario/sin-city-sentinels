import { Router } from 'express';
import { login, logout, getCurrentUser, verifyToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/login - Вход
router.post('/login', loginLimiter, login);

// POST /api/auth/logout - Выход (очищаем cookie)
router.post('/logout', authenticate, logout);

// GET /api/auth/me - Получить текущего пользователя (требует авторизации)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/verify - Проверить валидность токена
router.post('/verify', authenticate, verifyToken);

export default router;