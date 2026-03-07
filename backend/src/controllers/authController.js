import { findByUsername, createUserWithPasswordHash, hashPassword, verifyPassword, updatePassword, activateUser } from '../models/user.js';
import { createProfile, existsByCharacterUrl, getProfileByUserId, updateProfile } from '../models/userProfile.js';
import { createToken as createCharacterToken, verifyToken as verifyCharacterToken, deleteTokensByUserIdAndType } from '../models/characterVerificationToken.js';
import { createPendingRegistration, getPendingRegistrationByToken, deletePendingRegistrationById } from '../models/pendingCharacterRegistration.js';
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
 * POST /api/auth/register - Р РµРіРёСЃС‚СЂР°С†РёСЏ РЅРѕРІРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
 * РўСЂРµР±СѓРµС‚: password, characterUrl
 */
export const register = asyncHandler(async (req, res) => {
  const { password, characterUrl } = req.validatedBody;

  // РџСЂРѕРІРµСЂСЏРµРј, РЅРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ Р»Рё СѓР¶Рµ СЃСЃС‹Р»РєР° РЅР° РїРµСЂСЃРѕРЅР°Р¶Р°
  if (existsByCharacterUrl(characterUrl)) {
    throw new ApiError(400, 'Р­С‚РѕС‚ РїРµСЂСЃРѕРЅР°Р¶ СѓР¶Рµ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ');
  }

  // РџР°СЂСЃРёРј СЃС‚СЂР°РЅРёС†Сѓ РїРµСЂСЃРѕРЅР°Р¶Р° РџР•Р Р•Р” СЃРѕР·РґР°РЅРёРµРј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
  let html;
  try {
    html = await fetchCharacterPage(characterUrl);
  } catch (error) {
    logger.error('Failed to fetch character page:', error.message);
    throw new ApiError(400, 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ РїРµСЂСЃРѕРЅР°Р¶Р°. РџСЂРѕРІРµСЂСЊС‚Рµ СЃСЃС‹Р»РєСѓ.');
  }

  // РР·РІР»РµРєР°РµРј РЅРёРє РїРµСЂСЃРѕРЅР°Р¶Р° Рё СЃСЂР°РІРЅРёРІР°РµРј СЃ РІРІРµРґС‘РЅРЅС‹Рј
  const characterName = extractCharacterName(html);
  if (!characterName) {
    throw new ApiError(400, 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСЂРµРґРµР»РёС‚СЊ РЅРёРє РїРµСЂСЃРѕРЅР°Р¶Р° РЅР° СЃС‚СЂР°РЅРёС†Рµ');
  }

  const username = characterName.trim();

  // Проверяем уникальность по реальному нику из страницы персонажа
  const existingByUsername = findByUsername(username);
  if (existingByUsername) {
    throw new ApiError(400, 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ С‚Р°РєРёРј РЅРёРєРѕРј СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚');
  }

  // РР·РІР»РµРєР°РµРј РёР·РѕР±СЂР°Р¶РµРЅРёРµ РїРµСЂСЃРѕРЅР°Р¶Р°
  const characterImage = extractCharacterImage(html, characterUrl);

  // РЎРѕР·РґР°С‘Рј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (email Р±РѕР»СЊС€Рµ РЅРµ С‚СЂРµР±СѓРµС‚СЃСЏ, РїРµСЂРµРґР°С‘Рј null)
  const passwordHash = await hashPassword(password);
  const verificationToken = createPendingRegistration({
    username,
    passwordHash,
    characterUrl,
    characterName,
    characterImage,
  });

  logger.info('Pending registration created', { username, characterName, characterImage: !!characterImage });

  res.status(201).json({
    success: true,
    message: 'Р РµРіРёСЃС‚СЂР°С†РёСЏ СѓСЃРїРµС€РЅР°. Р Р°Р·РјРµСЃС‚РёС‚Рµ РєРѕРґ РІРµСЂРёС„РёРєР°С†РёРё РІ РїСЂРѕС„РёР»Рµ РїРµСЂСЃРѕРЅР°Р¶Р°.',
    verificationToken, // РџРѕРєР°Р·С‹РІР°РµРј РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ РґР»СЏ СЂР°Р·РјРµС‰РµРЅРёСЏ РІ РїСЂРѕС„РёР»Рµ
    user: {
      id: 0,
      username,
      role: 'user',
      is_verified: false
    }
  });
});

/**
 * POST /api/auth/verify-character - Р’РµСЂРёС„РёРєР°С†РёСЏ С‡РµСЂРµР· РїРµСЂСЃРѕРЅР°Р¶Р°
 * РўСЂРµР±СѓРµС‚: token
 */
export const verifyCharacter = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'РўРѕРєРµРЅ РѕР±СЏР·Р°С‚РµР»РµРЅ');
  }

  // Новый flow: до верификации пользователь еще не создан
  const pending = getPendingRegistrationByToken(token);
  if (pending) {
    const isTokenPresent = await verifyTokenOnCharacterPage(pending.character_url, token);
    if (!isTokenPresent) {
      throw new ApiError(400, 'РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ РІ РїСЂРѕС„РёР»Рµ РїРµСЂСЃРѕРЅР°Р¶Р°. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РІС‹ СЂР°Р·РјРµСЃС‚РёР»Рё РµРіРѕ РІ СЂР°Р·РґРµР»Рµ "Рћ СЃРµР±Рµ"');
    }

    // Имя и персонаж НЕ резервируются до верификации - проверяем уникальность в момент активации
    if (findByUsername(pending.username)) {
      deletePendingRegistrationById(pending.id);
      throw new ApiError(409, 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃ С‚Р°РєРёРј РЅРёРєРѕРј СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚. РџРѕРІС‚РѕСЂРёС‚Рµ СЂРµРіРёСЃС‚СЂР°С†РёСЋ.');
    }
    if (existsByCharacterUrl(pending.character_url)) {
      deletePendingRegistrationById(pending.id);
      throw new ApiError(409, 'Р­С‚РѕС‚ РїРµСЂСЃРѕРЅР°Р¶ СѓР¶Рµ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ. РџРѕРІС‚РѕСЂРёС‚Рµ СЂРµРіРёСЃС‚СЂР°С†РёСЋ.');
    }

    const user = createUserWithPasswordHash(pending.username, null, pending.password_hash, 'user');
    await createProfile(user.id, pending.username, pending.character_url);
    if (pending.character_image) {
      await updateProfile(user.id, { character_url: pending.character_url, character_image: pending.character_image });
    }

    const { setVerified } = await import('../models/userProfile.js');
    setVerified(user.id, true);
    activateUser(user.id);
    deletePendingRegistrationById(pending.id);

    logger.info('Character verification successful (pending flow)', { userId: user.id, username: user.username });
    return res.json({
      success: true,
      message: 'Р’РµСЂРёС„РёРєР°С†РёСЏ СѓСЃРїРµС€РЅР°! РўРµРїРµСЂСЊ РІС‹ РјРѕР¶РµС‚Рµ РєРѕРјРјРµРЅС‚РёСЂРѕРІР°С‚СЊ РЅРѕРІРѕСЃС‚Рё.'
    });
  }

  // РџСЂРѕРІРµСЂСЏРµРј С‚РѕРєРµРЅ
  const tokenRecord = verifyCharacterToken(token);
  if (!tokenRecord) {
    throw new ApiError(400, 'РќРµРІРµСЂРЅС‹Р№ РёР»Рё РёСЃС‚С‘РєС€РёР№ С‚РѕРєРµРЅ РІРµСЂРёС„РёРєР°С†РёРё');
  }

  // РџРѕР»СѓС‡Р°РµРј РїСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
  const profile = getProfileByUserId(tokenRecord.user_id);
  if (!profile || !profile.character_url) {
    throw new ApiError(400, 'РџСЂРѕС„РёР»СЊ РїРµСЂСЃРѕРЅР°Р¶Р° РЅРµ РЅР°Р№РґРµРЅ');
  }

  try {
    // РџСЂРѕРІРµСЂСЏРµРј С‚РѕРєРµРЅ РЅР° СЃС‚СЂР°РЅРёС†Рµ РїРµСЂСЃРѕРЅР°Р¶Р°
    const isTokenPresent = await verifyTokenOnCharacterPage(profile.character_url, token);
    
    if (!isTokenPresent) {
      throw new ApiError(400, 'РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ РІ РїСЂРѕС„РёР»Рµ РїРµСЂСЃРѕРЅР°Р¶Р°. РЈР±РµРґРёС‚РµСЃСЊ, С‡С‚Рѕ РІС‹ СЂР°Р·РјРµСЃС‚РёР»Рё РµРіРѕ РІ СЂР°Р·РґРµР»Рµ "Рћ СЃРµР±Рµ"');
    }

    // РђРєС‚РёРІРёСЂСѓРµРј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
    const { setVerified } = await import('../models/userProfile.js');
    setVerified(tokenRecord.user_id, true);

    // РђРєС‚РёРІРёСЂСѓРµРј Р°РєРєР°СѓРЅС‚ (is_active = 1)
    activateUser(tokenRecord.user_id);

    // РЈРґР°Р»СЏРµРј С‚РѕРєРµРЅ
    deleteTokensByUserIdAndType(tokenRecord.user_id, tokenRecord.type);

    logger.info('Character verification successful', { userId: tokenRecord.user_id });

    res.json({
      success: true,
      message: 'Р’РµСЂРёС„РёРєР°С†РёСЏ СѓСЃРїРµС€РЅР°! РўРµРїРµСЂСЊ РІС‹ РјРѕР¶РµС‚Рµ РєРѕРјРјРµРЅС‚РёСЂРѕРІР°С‚СЊ РЅРѕРІРѕСЃС‚Рё.'
    });
  } catch (error) {
    logger.error('Character verification error:', error.message);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'РћС€РёР±РєР° РїСЂРё РїСЂРѕРІРµСЂРєРµ С‚РѕРєРµРЅР°: ' + error.message);
  }
});

/**
 * POST /api/auth/login - Р’С…РѕРґ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
 * РўСЂРµР±СѓРµС‚: username, password
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.validatedBody;

  // РџРѕРёСЃРє РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ username (РЅРёРє РІ РђСЂРµРЅРµ)
  const user = findByUsername(username);

  if (!user) {
    logger.warn('Login attempt with invalid username', { username });
    throw new ApiError(401, 'РќРµРІРµСЂРЅС‹Р№ РЅРёРє РёР»Рё РїР°СЂРѕР»СЊ');
  }

  // РџСЂРѕРІРµСЂРєР° Р°РєС‚РёРІРЅРѕСЃС‚Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
  if (!user.is_active) {
    throw new ApiError(401, 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ Р°РєС‚РёРІРёСЂРѕРІР°РЅ. РџСЂРѕР№РґРёС‚Рµ РІРµСЂРёС„РёРєР°С†РёСЋ С‡РµСЂРµР· РїРµСЂСЃРѕРЅР°Р¶Р°.');
  }

  // РџСЂРѕРІРµСЂРєР° РїР°СЂРѕР»СЏ
  const isPasswordValid = await verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    logger.warn('Login attempt with invalid password', { username });
    throw new ApiError(401, 'РќРµРІРµСЂРЅС‹Р№ РЅРёРє РёР»Рё РїР°СЂРѕР»СЊ');
  }

  // РџРѕР»СѓС‡Р°РµРј РїСЂРѕС„РёР»СЊ РґР»СЏ is_verified
  const profile = getProfileByUserId(user.id);

  // Р“РµРЅРµСЂР°С†РёСЏ JWT С‚РѕРєРµРЅР°
  const token = generateToken(user);

  logger.info('User logged in', { username: user.username, role: user.role });

  // Р’РѕР·РІСЂР°С‰Р°РµРј РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РїРѕР»СЊР·РѕРІР°С‚РµР»Рµ Рё С‚РѕРєРµРЅ
  res.json({
    success: true,
    message: 'Р’С…РѕРґ СѓСЃРїРµС€РµРЅ',
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
 * POST /api/auth/logout - Р’С‹С…РѕРґ РёР· СЃРёСЃС‚РµРјС‹
 */
export const logout = asyncHandler(async (req, res) => {
  logger.info('User logged out', { username: req.user?.username });

  res.json({
    success: true,
    message: 'Р’С‹С…РѕРґ СѓСЃРїРµС€РµРЅ'
  });
});

/**
 * GET /api/auth/me - РџРѕР»СѓС‡РёС‚СЊ С‚РµРєСѓС‰РµРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
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
 * POST /api/auth/verify-token - РџСЂРѕРІРµСЂРёС‚СЊ РІР°Р»РёРґРЅРѕСЃС‚СЊ С‚РѕРєРµРЅР°
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
 * POST /api/auth/reset-password-request - Р—Р°РїСЂРѕСЃ С‚РѕРєРµРЅР° СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ
 */
export const resetPasswordRequest = asyncHandler(async (req, res) => {
  const { username, characterUrl } = req.body;

  if (!username || !characterUrl) {
    throw new ApiError(400, 'РќРёРє Рё СЃСЃС‹Р»РєР° РЅР° РїРµСЂСЃРѕРЅР°Р¶Р° РѕР±СЏР·Р°С‚РµР»СЊРЅС‹');
  }

  const user = findByUsername(username);
  if (!user) {
    // РќРµ СЂР°СЃРєСЂС‹РІР°РµРј, СЃСѓС‰РµСЃС‚РІСѓРµС‚ Р»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ
    return res.json({
      success: true,
      message: 'Р•СЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃСѓС‰РµСЃС‚РІСѓРµС‚, С‚РѕРєРµРЅ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ Р±СѓРґРµС‚ СЃРѕР·РґР°РЅ'
    });
  }

  // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ characterUrl СЃРѕРІРїР°РґР°РµС‚ СЃ РїСЂРѕС„РёР»РµРј
  const profile = getProfileByUserId(user.id);
  if (!profile || profile.character_url !== characterUrl) {
    throw new ApiError(400, 'РЎСЃС‹Р»РєР° РЅР° РїРµСЂСЃРѕРЅР°Р¶Р° РЅРµ СЃРѕРІРїР°РґР°РµС‚ СЃ РїСЂРѕС„РёР»РµРј');
  }

  // РЎРѕР·РґР°С‘Рј С‚РѕРєРµРЅ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ
  const token = createCharacterToken(user.id, 'password_reset');

  logger.info('Password reset requested', { username: user.username });

  res.json({
    success: true,
    message: 'Р Р°Р·РјРµСЃС‚РёС‚Рµ РєРѕРґ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ РІ РїСЂРѕС„РёР»Рµ РїРµСЂСЃРѕРЅР°Р¶Р°',
    resetToken: token // РџРѕРєР°Р·С‹РІР°РµРј С‚РѕРєРµРЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЋ
  });
});

/**
 * POST /api/auth/reset-password/:token - РЎР±СЂРѕСЃ РїР°СЂРѕР»СЏ РїРѕ С‚РѕРєРµРЅСѓ
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw new ApiError(400, 'РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РЅРµ РјРµРЅРµРµ 6 СЃРёРјРІРѕР»РѕРІ');
  }

  // РџСЂРѕРІРµСЂСЏРµРј С‚РѕРєРµРЅ
  const tokenRecord = verifyCharacterToken(token);
  if (!tokenRecord || tokenRecord.type !== 'password_reset') {
    throw new ApiError(400, 'РќРµРІРµСЂРЅС‹Р№ РёР»Рё РёСЃС‚С‘РєС€РёР№ С‚РѕРєРµРЅ СЃР±СЂРѕСЃР° РїР°СЂРѕР»СЏ');
  }

  // РџРѕР»СѓС‡Р°РµРј РїСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
  const profile = getProfileByUserId(tokenRecord.user_id);
  if (!profile || !profile.character_url) {
    throw new ApiError(400, 'РџСЂРѕС„РёР»СЊ РїРµСЂСЃРѕРЅР°Р¶Р° РЅРµ РЅР°Р№РґРµРЅ');
  }

  try {
    // РџСЂРѕРІРµСЂСЏРµРј С‚РѕРєРµРЅ РЅР° СЃС‚СЂР°РЅРёС†Рµ РїРµСЂСЃРѕРЅР°Р¶Р°
    const isTokenPresent = await verifyTokenOnCharacterPage(profile.character_url, token);
    
    if (!isTokenPresent) {
      throw new ApiError(400, 'РўРѕРєРµРЅ РЅРµ РЅР°Р№РґРµРЅ РІ РїСЂРѕС„РёР»Рµ РїРµСЂСЃРѕРЅР°Р¶Р°');
    }

    // РћР±РЅРѕРІР»СЏРµРј РїР°СЂРѕР»СЊ
    await updatePassword(tokenRecord.user_id, password);

    // РЈРґР°Р»СЏРµРј С‚РѕРєРµРЅ
    deleteTokensByUserIdAndType(tokenRecord.user_id, 'password_reset');

    logger.info('Password reset successful', { userId: tokenRecord.user_id });

    res.json({
      success: true,
      message: 'РџР°СЂРѕР»СЊ СѓСЃРїРµС€РЅРѕ СЃР±СЂРѕС€РµРЅ'
    });
  } catch (error) {
    logger.error('Password reset error:', error.message);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'РћС€РёР±РєР° РїСЂРё РїСЂРѕРІРµСЂРєРµ С‚РѕРєРµРЅР°: ' + error.message);
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




