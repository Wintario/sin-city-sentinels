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
  return {
    enabled: getSetting('clan_widget_enabled') !== '0',
    title: getSetting('clan_widget_title') || 'Информация для сокланов',
    body: getSetting('clan_widget_body') || ''
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
