import settingsModel from '../models/settings.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Папка для загрузки файлов
const UPLOADS_DIR = join(__dirname, '../../public/uploads');

/**
 * Получить настройки фона
 */
export async function getBackground(req, res, next) {
  try {
    const settings = settingsModel.getBackgroundSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

/**
 * Обновить настройки фона (цвет, прозрачность)
 */
export async function updateBackground(req, res, next) {
  try {
    const { color, opacity, image_url } = req.body;
    
    const settings = settingsModel.updateBackgroundSettings({
      color,
      opacity,
      image_url
    });
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

/**
 * Загрузить файл фона
 */
export async function uploadBackground(req, res, next) {
  try {
    // Проверяем наличие файла в теле запроса (base64)
    const { file, filename, mimetype } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'Файл не предоставлен' });
    }
    
    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (mimetype && !allowedTypes.includes(mimetype)) {
      return res.status(400).json({ error: 'Поддерживаются только JPG, PNG и WebP' });
    }
    
    // Создаём папку uploads если не существует
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    
    // Генерируем уникальное имя файла
    const ext = filename ? filename.split('.').pop() : 'jpg';
    const uniqueName = `bg_${Date.now()}.${ext}`;
    const filePath = join(UPLOADS_DIR, uniqueName);
    
    // Декодируем base64 и сохраняем
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(filePath, buffer);
    
    // Формируем URL
    const imageUrl = `/uploads/${uniqueName}`;
    
    // Сохраняем в настройки
    settingsModel.updateBackgroundSettings({ image_url: imageUrl });
    
    res.json({ image_url: imageUrl });
  } catch (error) {
    next(error);
  }
}

export async function getMembersVisibility(req, res, next) {
  try {
    const settings = settingsModel.getMembersVisibilitySettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateMembersVisibility(req, res, next) {
  try {
    const { visible } = req.body;

    if (typeof visible !== 'boolean') {
      return res.status(400).json({ error: 'visible must be a boolean' });
    }

    const settings = settingsModel.updateMembersVisibilitySettings({ visible });
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function getClanWidget(req, res, next) {
  try {
    const settings = settingsModel.getClanWidgetSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateClanWidget(req, res, next) {
  try {
    const { enabled, title, body } = req.body;

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }
    if (title !== undefined && typeof title !== 'string') {
      return res.status(400).json({ error: 'title must be a string' });
    }
    if (body !== undefined && typeof body !== 'string') {
      return res.status(400).json({ error: 'body must be a string' });
    }

    const settings = settingsModel.updateClanWidgetSettings({
      enabled,
      title,
      body
    });
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export default {
  getBackground,
  updateBackground,
  uploadBackground,
  getMembersVisibility,
  updateMembersVisibility,
  getClanWidget,
  updateClanWidget
};
