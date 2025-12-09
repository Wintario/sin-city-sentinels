import { Router } from 'express';
import { login, getCurrentUser, verifyToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/login - Вход
router.post('/login', loginLimiter, login);

// GET /api/auth/me - Получить текущего пользователя (требует авторизации)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/verify - Проверить валидность токена
router.post('/verify', authenticate, verifyToken);

export default router;
