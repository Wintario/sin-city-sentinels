import { findByUsername, findByEmail, createUser, verifyPassword, updatePassword, activateUser } from '../models/user.js';
import { createProfile, existsByCharacterUrl, getProfileByUserId, updateProfile } from '../models/userProfile.js';
import { createToken as createCharacterToken, verifyToken as verifyCharacterToken, deleteTokensByUserIdAndType } from '../models/characterVerificationToken.js';
import { generateToken } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { 
  verifyTokenOnCharacterPage, 
  extractCharacterName,
  extractCharacterImage,
  fetchCharacterPage 
} from '../services/characterVerificationService.js';

/**
 * POST /api/auth/register - Регистрация нового пользователя
 * Требует: username, password, characterUrl
 */
export const register = asyncHandler(async (req, res) => {
  const { username, password, characterUrl } = req.validatedBody;

  // Проверяем, существует ли пользователь с таким username
  const existingByUsername = findByUsername(username);
  if (existingByUsername) {
    throw new ApiError(400, 'Пользователь с таким ником уже существует');
  }

  // Проверяем, не используется ли уже ссылка на персонажа
  if (existsByCharacterUrl(characterUrl)) {
    throw new ApiError(400, 'Этот персонаж уже зарегистрирован');
  }

  // Парсим страницу персонажа ПЕРЕД созданием пользователя
  let html;
  try {
    html = await fetchCharacterPage(characterUrl);
  } catch (error) {
    logger.error('Failed to fetch character page:', error.message);
    throw new ApiError(400, 'Не удалось загрузить страницу персонажа. Проверьте ссылку.');
  }

  // Извлекаем ник персонажа и сравниваем с введённым
  const characterName = extractCharacterName(html);
  if (!characterName) {
    throw new ApiError(400, 'Не удалось определить ник персонажа на странице');
  }

  // Сравниваем ники (нечувствительно к регистру и пробелам)
  const normalizeName = (name) => name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (normalizeName(characterName) !== normalizeName(username)) {
    throw new ApiError(400, `Ник не совпадает с именем персонажа. На странице указано: "${characterName}"`);
  }

  // Извлекаем изображение персонажа
  const characterImage = extractCharacterImage(html);

  // Создаём пользователя (email больше не требуется, передаём null)
  const user = await createUser(username, null, password, 'user');

  // Создаём профиль с изображением персонажа
  await createProfile(user.id, username, characterUrl);
  
  // Если изображение найдено, обновляем профиль
  if (characterImage) {
    await updateProfile(user.id, { character_url: characterUrl, character_image: characterImage });
  }

  // Создаём токен верификации через персонажа
  const verificationToken = createCharacterToken(user.id, 'registration');

  logger.info('User registered', { username: user.username, characterName, characterImage: !!characterImage });

  res.status(201).json({
    success: true,
    message: 'Регистрация успешна. Разместите код верификации в профиле персонажа.',
    verificationToken, // Показываем пользователю для размещения в профиле
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      is_verified: false
    }
  });
});

/**
 * POST /api/auth/verify-character - Верификация через персонажа
 * Требует: token
 */
export const verifyCharacter = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Токен обязателен');
  }

  // Проверяем токен
  const tokenRecord = verifyCharacterToken(token);
  if (!tokenRecord) {
    throw new ApiError(400, 'Неверный или истёкший токен верификации');
  }

  // Получаем профиль пользователя
  const profile = getProfileByUserId(tokenRecord.user_id);
  if (!profile || !profile.character_url) {
    throw new ApiError(400, 'Профиль персонажа не найден');
  }

  try {
    // Проверяем токен на странице персонажа
    const isTokenPresent = await verifyTokenOnCharacterPage(profile.character_url, token);
    
    if (!isTokenPresent) {
      throw new ApiError(400, 'Токен не найден в профиле персонажа. Убедитесь, что вы разместили его в разделе "О себе"');
    }

    // Активируем пользователя
    const { setVerified } = await import('../models/userProfile.js');
    setVerified(tokenRecord.user_id, true);

    // Активируем аккаунт (is_active = 1)
    activateUser(tokenRecord.user_id);

    // Удаляем токен
    deleteTokensByUserIdAndType(tokenRecord.user_id, tokenRecord.type);

    logger.info('Character verification successful', { userId: tokenRecord.user_id });

    res.json({
      success: true,
      message: 'Верификация успешна! Теперь вы можете комментировать новости.'
    });
  } catch (error) {
    logger.error('Character verification error:', error.message);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Ошибка при проверке токена: ' + error.message);
  }
});

/**
 * POST /api/auth/login - Вход пользователя
 * Требует: username, password
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.validatedBody;

  // Поиск пользователя по username (ник в Арене)
  const user = findByUsername(username);

  if (!user) {
    logger.warn('Login attempt with invalid username', { username });
    throw new ApiError(401, 'Неверный ник или пароль');
  }

  // Проверка активности пользователя
  if (!user.is_active) {
    throw new ApiError(401, 'Пользователь не активирован. Пройдите верификацию через персонажа.');
  }

  // Проверка пароля
  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', { username });
    throw new ApiError(401, 'Неверный ник или пароль');
  }

  // Получаем профиль для is_verified
  const profile = getProfileByUserId(user.id);

  // Генерация JWT токена
  const token = generateToken(user);

  logger.info('User logged in', { username: user.username, role: user.role });

  // Возвращаем информацию о пользователе и токен
  res.json({
    success: true,
    message: 'Вход успешен',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      is_verified: profile?.email_verified ? true : false
    }
  });
});

/**
 * POST /api/auth/logout - Выход из системы
 */
export const logout = asyncHandler(async (req, res) => {
  logger.info('User logged out', { username: req.user?.username });

  res.json({
    success: true,
    message: 'Выход успешен'
  });
});

/**
 * GET /api/auth/me - Получить текущего пользователя
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const profile = getProfileByUserId(req.user.id);
  
  res.json({
    success: true,
    user: {
      ...req.user,
      is_verified: profile?.email_verified ? true : false
    }
  });
});

/**
 * POST /api/auth/verify-token - Проверить валидность токена
 */
export const verifyToken = asyncHandler(async (req, res) => {
  const profile = getProfileByUserId(req.user.id);
  
  res.json({
    success: true,
    valid: true,
    user: {
      ...req.user,
      is_verified: profile?.email_verified ? true : false
    }
  });
});

/**
 * POST /api/auth/reset-password-request - Запрос токена сброса пароля
 */
export const resetPasswordRequest = asyncHandler(async (req, res) => {
  const { username, characterUrl } = req.body;

  if (!username || !characterUrl) {
    throw new ApiError(400, 'Ник и ссылка на персонажа обязательны');
  }

  const user = findByUsername(username);
  if (!user) {
    // Не раскрываем, существует ли пользователь
    return res.json({
      success: true,
      message: 'Если пользователь существует, токен сброса пароля будет создан'
    });
  }

  // Проверяем, что characterUrl совпадает с профилем
  const profile = getProfileByUserId(user.id);
  if (!profile || profile.character_url !== characterUrl) {
    throw new ApiError(400, 'Ссылка на персонажа не совпадает с профилем');
  }

  // Создаём токен сброса пароля
  const token = createCharacterToken(user.id, 'password_reset');

  logger.info('Password reset requested', { username: user.username });

  res.json({
    success: true,
    message: 'Разместите код сброса пароля в профиле персонажа',
    resetToken: token // Показываем токен пользователю
  });
});

/**
 * POST /api/auth/reset-password/:token - Сброс пароля по токену
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw new ApiError(400, 'Пароль должен быть не менее 6 символов');
  }

  // Проверяем токен
  const tokenRecord = verifyCharacterToken(token);
  if (!tokenRecord || tokenRecord.type !== 'password_reset') {
    throw new ApiError(400, 'Неверный или истёкший токен сброса пароля');
  }

  // Получаем профиль пользователя
  const profile = getProfileByUserId(tokenRecord.user_id);
  if (!profile || !profile.character_url) {
    throw new ApiError(400, 'Профиль персонажа не найден');
  }

  try {
    // Проверяем токен на странице персонажа
    const isTokenPresent = await verifyTokenOnCharacterPage(profile.character_url, token);
    
    if (!isTokenPresent) {
      throw new ApiError(400, 'Токен не найден в профиле персонажа');
    }

    // Обновляем пароль
    await updatePassword(tokenRecord.user_id, password);

    // Удаляем токен
    deleteTokensByUserIdAndType(tokenRecord.user_id, 'password_reset');

    logger.info('Password reset successful', { userId: tokenRecord.user_id });

    res.json({
      success: true,
      message: 'Пароль успешно сброшен'
    });
  } catch (error) {
    logger.error('Password reset error:', error.message);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Ошибка при проверке токена: ' + error.message);
  }
});

export default {
  register,
  verifyCharacter,
  login,
  logout,
  getCurrentUser,
  verifyToken,
  resetPasswordRequest,
  resetPassword
};
