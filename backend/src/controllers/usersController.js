import userModel from '../models/user.js';
import userBanModel from '../models/userBan.js';
import { getProfileByUserId, createProfile, updateProfile } from '../models/userProfile.js';
import { fetchCharacterPage, parseCharacterInfo } from '../services/characterVerificationService.js';

const TARGET_CLAN_NAME_NORMALIZED = 'свирепые кролики';

const normalizeClanName = (value) => {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
};

/**
 * Получить список всех пользователей (с профилями)
 */
export async function getAll(req, res, next) {
  try {
    const users = userModel.getAllUsersWithProfiles();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

/**
 * Получить пользователя по ID
 */
export async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const user = userModel.findById(parseInt(id));

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Создать нового пользователя
 */
export async function create(req, res, next) {
  try {
    const { username, password, role } = req.body;

    if (!username || username.length < 2) {
      return res.status(400).json({ error: 'Имя пользователя должно быть минимум 2 символа' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 4 символа' });
    }

    // Проверяем, существует ли пользователь
    const existing = userModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const validRole = role === 'admin' ? 'admin' : 'author';
    const user = await userModel.createUser(username, password, validRole);

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Обновить пользователя
 */
export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { username, email, password, role, arenaNickname, characterUrl } = req.body;

    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем новый username на уникальность (если меняется)
    if (username && username !== user.username) {
      if (username.length < 2) {
        return res.status(400).json({ error: 'Ник должен быть минимум 2 символа' });
      }
      const existingByUsername = userModel.findByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ error: 'Пользователь с таким ником уже существует' });
      }
    }

    // Проверяем новый email на уникальность (если меняется)
    if (email && email !== user.email) {
      const existingByEmail = userModel.findByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }

    // Обновляем username и email если переданы
    if (username || email) {
      const updates = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      await userModel.updateUserFields(parseInt(id), updates);
    }

    // Обновляем пароль если передан
    if (password && password.length >= 4) {
      await userModel.updatePassword(parseInt(id), password);
    }

    // Обновляем роль если передана
    if (role && (role === 'admin' || role === 'author' || role === 'user')) {
      userModel.updateUserRole(parseInt(id), role);
    }

    // Обновляем профиль (arena_nickname, character_url) если переданы.
    // Для старых пользователей профиль может отсутствовать — создаём его при первой установке characterUrl.
    if (arenaNickname !== undefined || characterUrl !== undefined) {
      const userId = parseInt(id);
      const existingProfile = getProfileByUserId(userId);

      if (!existingProfile) {
        const initialCharacterUrl = (characterUrl || '').trim();
        if (initialCharacterUrl) {
          const initialArenaNickname = (arenaNickname || username || user.username || '').trim();
          await createProfile(userId, initialArenaNickname || user.username, initialCharacterUrl);
        }
      }

      const profileForUpdate = getProfileByUserId(userId);
      if (profileForUpdate) {
        const profileUpdates = {};
        if (arenaNickname !== undefined) profileUpdates.arena_nickname = arenaNickname;
        if (characterUrl !== undefined) profileUpdates.character_url = characterUrl;
        updateProfile(userId, profileUpdates);

        const updatedProfile = getProfileByUserId(userId);
        if (updatedProfile?.character_url) {
          try {
            const html = await fetchCharacterPage(updatedProfile.character_url);
            const parsed = parseCharacterInfo(html, updatedProfile.character_url);
            const normalizedClanName = normalizeClanName(parsed?.clanName);
            const isTargetClanMember = normalizedClanName === TARGET_CLAN_NAME_NORMALIZED;

            updateProfile(userId, {
              character_image: parsed?.imageUrl || null,
              character_level: parsed?.level ?? null,
              race_code: parsed?.raceCode || null,
              race_class: parsed?.raceClass || null,
              race_title: parsed?.raceTitle || null,
              race_style: parsed?.raceStyle || null,
              clan_name: parsed?.clanName || null,
              clan_url: parsed?.clanUrl || null,
              clan_icon: parsed?.clanIcon || null,
              is_target_clan_member: isTargetClanMember,
              clan_checked_at: new Date().toISOString(),
            });
          } catch (error) {
            console.warn('Failed to refresh character metadata in user update:', error.message);
          }
        }
      }
    }

    const updatedUser = userModel.findById(parseInt(id));
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
}

/**
 * Забанить пользователя (временная блокировка)
 */
export async function ban(req, res, next) {
  try {
    const { id } = req.params;
    const { banDuration, reason } = req.body;
    const bannedBy = req.user.id;

    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, не последний ли это админ
    if (user.role === 'admin') {
      const allUsers = userModel.getAllUsersWithProfiles();
      const adminCount = allUsers.filter(u => u.role === 'admin' && u.is_active !== 0).length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Нельзя забанить последнего администратора' });
      }
    }

    // Определяем длительность бана
    let banEnd = null;
    let isPermanent = false;

    switch (banDuration) {
      case '1h':
        banEnd = new Date(Date.now() + 60 * 60 * 1000);
        break;
      case '1d':
        banEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
        break;
      case '3d':
        banEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        banEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        banEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'permanent':
      default:
        isPermanent = true;
        break;
    }

    const banInfo = userBanModel.banUser(parseInt(id), bannedBy, reason, banEnd, isPermanent);

    res.json({
      success: true,
      message: isPermanent ? 'Пользователь забанен навсегда' : `Пользователь забанен до ${banEnd.toLocaleString('ru-RU')}`,
      ban: banInfo
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Разбанить пользователя
 */
export async function unban(req, res, next) {
  try {
    const { id } = req.params;

    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const result = userBanModel.unbanUser(parseInt(id));

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Полностью удалить пользователя из БД
 * ⚠️ ЗАЩИЩЁННЫЙ ПОЛЬЗОВАТЕЛЬ: зайчонок имеет вечные права администратора
 * и не может быть удалён НИ ПРИ КАКИХ ОБСТОЯТЕЛЬСТВАХ.
 * Это правило действует для ВСЕХ администраторов без исключений.
 */
export async function permanentDelete(req, res, next) {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    const user = userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // ⚠️ АБСОЛЮТНАЯ ЗАЩИТА: пользователь зайчонок не может быть удалён
    // Это правило имеет наивысший приоритет и не может быть отменено
    if (user.username === 'зайчонок') {
      return res.status(403).json({ 
        error: 'Пользователь зайчонок имеет вечные права администратора и не может быть удалён',
        protection: 'permanent_admin_protection',
        message: 'Это правило зафиксировано в коде и не подлежит изменению'
      });
    }

    // Проверяем, не последний ли это активный админ
    if (user.role === 'admin') {
      const allUsers = userModel.getAllUsersWithProfiles();
      // Считаем всех активных админов КРОМЕ того, которого удаляем
      const activeAdmins = allUsers.filter(u =>
        u.role === 'admin' && u.is_active !== 0 && u.id !== userId
      );

      if (activeAdmins.length === 0) {
        return res.status(400).json({ error: 'Нельзя удалить последнего активного администратора' });
      }
    }

    const result = userBanModel.permanentDelete(userId);

    res.json({
      success: result.success,
      message: 'Пользователь полностью удалён'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Получить информацию о бане пользователя
 */
export async function getBanInfo(req, res, next) {
  try {
    const { id } = req.params;

    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const banInfo = userBanModel.getBanInfo(parseInt(id));

    res.json({
      success: true,
      ban: banInfo
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Сбросить пароль пользователя
 */
export async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }

    const user = userModel.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await userModel.updatePassword(parseInt(id), newPassword);
    res.json({ success: true, message: 'Пароль сброшен' });
  } catch (error) {
    next(error);
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  ban,
  unban,
  permanentDelete,
  getBanInfo,
  resetPassword
};
