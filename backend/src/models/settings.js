import { getDatabase } from '../db/db.js';

/**
 * Получить значение настройки по ключу
 */
export function getSetting(key) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

/**
 * Установить значение настройки
 */
export function setSetting(key, value) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET 
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value);
}

function parseJsonSetting(key, fallback) {
  const raw = getSetting(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function parseFightDateToTimestamp(raw) {
  const value = (raw || '').trim();
  if (!value) return Number.NaN;

  const dot = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dot) {
    const day = Number(dot[1]);
    const month = Number(dot[2]);
    let year = Number(dot[3]);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day).getTime();
  }

  return new Date(value).getTime();
}

function normalizeFightTime(raw) {
  return String(raw || '').trim().replace(/^в\s+/i, '');
}

/**
 * Получить все настройки фона
 */
export function getBackgroundSettings() {
  return {
    image_url: getSetting('bg_image_url') || '',
    color: getSetting('bg_color') || '#1a1a1a',
    opacity: parseFloat(getSetting('bg_opacity') || '0.7'),
  };
}

/**
 * Обновить настройки фона
 */
export function updateBackgroundSettings(data) {
  if (data.image_url !== undefined) {
    setSetting('bg_image_url', data.image_url);
  }
  if (data.color !== undefined) {
    setSetting('bg_color', data.color);
  }
  if (data.opacity !== undefined) {
    setSetting('bg_opacity', String(data.opacity));
  }
  return getBackgroundSettings();
}

export function getMembersVisibilitySettings() {
  return {
    visible: getSetting('members_visible') === '1',
  };
}

export function updateMembersVisibilitySettings(data) {
  if (data.visible !== undefined) {
    setSetting('members_visible', data.visible ? '1' : '0');
  }

  return getMembersVisibilitySettings();
}

export function getClanWidgetSettings() {
  const fights = parseJsonSetting('clan_widget_fights', []);
  const normalizedFights = Array.isArray(fights)
    ? fights
        .map((fight) => ({
          date: typeof fight?.date === 'string' ? fight.date.trim() : '',
          time: typeof fight?.time === 'string' ? normalizeFightTime(fight.time) : '',
          opponent: typeof fight?.opponent === 'string' ? fight.opponent.trim() : '',
        }))
        .filter((fight) => fight.date && fight.opponent)
    : [];

  // Автоочистка прошедших боёв, чтобы они не показывались снова в будущем.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayTs = startOfToday.getTime();

  const upcomingFights = normalizedFights.filter((fight) => {
    const ts = parseFightDateToTimestamp(fight.date);
    // Невалидные даты оставляем, чтобы админ мог поправить вручную.
    if (Number.isNaN(ts)) return true;
    return ts >= todayTs;
  });

  if (upcomingFights.length !== normalizedFights.length) {
    setSetting('clan_widget_fights', JSON.stringify(upcomingFights));
  }

  return {
    enabled: getSetting('clan_widget_enabled') !== '0',
    title: getSetting('clan_widget_title') || 'Информация для сокланов',
    body: getSetting('clan_widget_body') || '',
    fights: upcomingFights
  };
}

export function updateClanWidgetSettings(data) {
  if (data.enabled !== undefined) {
    setSetting('clan_widget_enabled', data.enabled ? '1' : '0');
  }
  if (data.title !== undefined) {
    setSetting('clan_widget_title', data.title);
  }
  if (data.body !== undefined) {
    setSetting('clan_widget_body', data.body);
  }
  if (data.fights !== undefined) {
    const normalizedFights = Array.isArray(data.fights)
      ? data.fights
          .map((fight) => ({
            date: typeof fight?.date === 'string' ? fight.date.trim() : '',
            time: typeof fight?.time === 'string' ? normalizeFightTime(fight.time) : '',
            opponent: typeof fight?.opponent === 'string' ? fight.opponent.trim() : '',
          }))
          .filter((fight) => fight.date && fight.opponent)
      : [];
    setSetting('clan_widget_fights', JSON.stringify(normalizedFights));
  }

  return getClanWidgetSettings();
}

export default {
  getSetting,
  setSetting,
  getBackgroundSettings,
  updateBackgroundSettings,
  getMembersVisibilitySettings,
  updateMembersVisibilitySettings,
  getClanWidgetSettings,
  updateClanWidgetSettings
};
