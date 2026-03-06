import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, verificationLimiter } from '../middleware/rateLimiter.js';
import {
  validateRegisterMiddleware,
  validateLoginMiddleware,
  validateVerifyCharacterMiddleware,
  validateResetPasswordRequestMiddleware,
  validateResetPasswordMiddleware
} from '../middleware/validateAuth.js';
import {
  register,
  verifyCharacter,
  login,
  logout,
  getCurrentUser,
  verifyToken,
  resetPasswordRequest,
  resetPassword
} from '../controllers/authController.js';

const router = Router();

// ============================================
// Регистрация и вход
// ============================================

/**
 * POST /api/auth/register - Регистрация нового пользователя
 * @body {string} username - Ник в Арене (для входа)
 * @body {string} password - Пароль
 * @body {string} arenaNickname - Отображаемое имя
 * @body {string} characterUrl - Ссылка на персонажа (обязательно)
 */
router.post('/register',
  registerLimiter,
  validateRegisterMiddleware,
  register
);

/**
 * POST /api/auth/login - Вход пользователя
 * @body {string} username - Ник в Арене
 * @body {string} password - Пароль
 */
router.post('/login',
  loginLimiter,
  validateLoginMiddleware,
  login
);

/**
 * POST /api/auth/logout - Выход из системы
 * @header {string} Authorization - Bearer <token>
 */
router.post('/logout', authenticate, logout);

// ============================================
// Информация о пользователе
// ============================================

/**
 * GET /api/auth/me - Получить текущего пользователя
 * @header {string} Authorization - Bearer <token>
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * POST /api/auth/verify-token - Проверить валидность токена
 * @header {string} Authorization - Bearer <token>
 */
router.post('/verify-token', authenticate, verifyToken);

// ============================================
// Верификация через персонажа
// ============================================

/**
 * POST /api/auth/verify-character - Верификация через персонажа
 * @body {string} token - Токен верификации
 */
router.post('/verify-character',
  verificationLimiter,
  validateVerifyCharacterMiddleware,
  verifyCharacter
);

// ============================================
// Сброс пароля через персонажа
// ============================================

/**
 * POST /api/auth/reset-password-request - Запрос токена сброса пароля
 * @body {string} username - Ник пользователя
 * @body {string} characterUrl - Ссылка на персонажа
 */
router.post('/reset-password-request',
  validateResetPasswordRequestMiddleware,
  resetPasswordRequest
);

/**
 * POST /api/auth/reset-password/:token - Сброс пароля по токену
 * @param {string} token - Токен сброса пароля
 * @body {string} password - Новый пароль
 */
router.post('/reset-password/:token',
  validateResetPasswordMiddleware,
  resetPassword
);

export default router;
