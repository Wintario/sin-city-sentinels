import { findByUsername, verifyPassword } from '../models/user.js';
import { generateToken } from '../middleware/auth.js';
import { validateLoginInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * POST /api/auth/login
 * Аутентификация пользователя
 * Устанавливает безопасный HttpOnly cookie с токеном
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Валидация входных данных
  const validated = validateLoginInput(username, password);
  
  // Поиск пользователя
  const user = findByUsername(validated.username);
  
  if (!user) {
    logger.warn('Login attempt with invalid username', { username: validated.username });
    throw new ApiError(401, 'Invalid username or password');
  }
  
  // Проверка пароля
  const isPasswordValid = await verifyPassword(validated.password, user.password_hash);
  
  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', { username: validated.username });
    throw new ApiError(401, 'Invalid username or password');
  }
  
  // Генерация токена
  const token = generateToken(user);
  
  logger.info('User logged in', { username: user.username, role: user.role });
  
  // Устанавливаем HttpOnly cookie
  // HttpOnly - не доступна для JavaScript (защита от XSS)
  // Secure - только через HTTPS в production
  // SameSite=Strict - защита от CSRF
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only в production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    path: '/'
  });
  
  // Также возвращаем токен для localStorage (для резервной копии)
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

/**
 * POST /api/auth/logout
 * Выход из системы - очищаем cookie
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  logger.info('User logged out', { username: req.user?.username });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: req.user
  });
});

/**
 * POST /api/auth/verify
 * Проверка валидности токена
 */
export const verifyToken = asyncHandler(async (req, res) => {
  // Если мы дошли до этого контроллера, значит authenticate middleware
  // уже проверил токен и добавил req.user
  res.json({
    valid: true,
    user: req.user
  });
});

export default {
  login,
  logout,
  getCurrentUser,
  verifyToken
};