import { findByUsername, verifyPassword } from '../models/user.js';
import { generateToken } from '../middleware/auth.js';
import { validateLoginInput } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * POST /api/auth/login
 * Аутентификация пользователя
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // Валидация входных данных
  const validated = validateLoginInput(username, password);
  
  // Поиск пользователя
  const user = findByUsername(validated.username);
  
  if (!user) {
    throw new ApiError(401, 'Invalid username or password');
  }
  
  // Проверка пароля
  const isPasswordValid = await verifyPassword(validated.password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid username or password');
  }
  
  // Генерация токена
  const token = generateToken(user);
  
  // Ответ без пароля
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
  getCurrentUser,
  verifyToken
};
