import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// КОНСТАНТЫ
// ============================================

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const NEWS_IMAGES_DIR = path.join(UPLOADS_DIR, 'news-images');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const VIDEO_THUMBS_DIR = path.join(UPLOADS_DIR, 'video_thumbs');
const VIDEO_TEMP_DIR = path.join(UPLOADS_DIR, 'video_temp');

// Порог сжатия (если файл больше - сжимаем)
const COMPRESSION_THRESHOLD = 1 * 1024 * 1024; // 1 MB
const COMPRESSION_QUALITY = 80; // качество после сжатия

// ============================================
// ФУНКЦИИ
// ============================================

/**
 * Убедиться, что директория существует
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

/**
 * Инициализация директорий для загрузок
 */
export const initUploadDirectories = () => {
  ensureDirectoryExists(UPLOADS_DIR);
  ensureDirectoryExists(NEWS_IMAGES_DIR);
  ensureDirectoryExists(AVATARS_DIR);
  ensureDirectoryExists(VIDEOS_DIR);
  ensureDirectoryExists(VIDEO_THUMBS_DIR);
  ensureDirectoryExists(VIDEO_TEMP_DIR);
  logger.info('Upload directories initialized');
};

/**
 * Получить полный путь к директории изображений новостей
 */
export const getNewsImagesDir = () => NEWS_IMAGES_DIR;

/**
 * Получить полный путь к директории аватарок
 */
export const getAvatarsDir = () => AVATARS_DIR;

/**
 * РџРѕР»СѓС‡РёС‚СЊ РїРѕР»РЅС‹Р№ РїСѓС‚СЊ Рє РґРёСЂРµРєС‚РѕСЂРёРё РІРёРґРµРѕ
 */
export const getVideosDir = () => VIDEOS_DIR;

/**
 * РџРѕР»СѓС‡РёС‚СЊ РїРѕР»РЅС‹Р№ РїСѓС‚СЊ Рє РґРёСЂРµРєС‚РѕСЂРёРё thumbnail РІРёРґРµРѕ
 */
export const getVideoThumbsDir = () => VIDEO_THUMBS_DIR;

/**
 * РџРѕР»СѓС‡РёС‚СЊ РїРѕР»РЅС‹Р№ РїСѓС‚СЊ Рє РІСЂРµРјРµРЅРЅРѕР№ РґРёСЂРµРєС‚РѕСЂРёРё РІРёРґРµРѕ
 */
export const getVideoTempDir = () => VIDEO_TEMP_DIR;

/**
 * Получить публичный URL для файла
 */
export const getPublicUrl = (filename, type = 'news-images') => {
  return `/uploads/${type}/${filename}`;
};

/**
 * Проверить существование файла
 */
export const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * Удалить файл
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', { path: filePath, error: error.message });
    throw error;
  }
};

/**
 * Получить размер файла в байтах
 */
export const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.size;
};

/**
 * Сжать изображение если оно больше порога
 * Возвращает путь к сжатому файлу (может быть тот же самый)
 */
export const compressImageIfNeeded = async (filePath) => {
  try {
    const fileSize = getFileSize(filePath);
    
    if (fileSize <= COMPRESSION_THRESHOLD) {
      logger.debug(`File ${filePath} is small enough, skipping compression`);
      return filePath;
    }
    
    logger.info(`Compressing image ${filePath} (${Math.round(fileSize / 1024)}KB)`);
    
    const ext = path.extname(filePath).toLowerCase();
    const tempPath = filePath + '.temp';
    
    // Определяем формат и сжимаем
    let sharpPipeline = sharp(filePath);
    
    if (ext === '.jpg' || ext === '.jpeg') {
      sharpPipeline = sharpPipeline.jpeg({ quality: COMPRESSION_QUALITY });
    } else if (ext === '.png') {
      sharpPipeline = sharpPipeline.png({ quality: COMPRESSION_QUALITY, compressionLevel: 6 });
    } else if (ext === '.webp') {
      sharpPipeline = sharpPipeline.webp({ quality: COMPRESSION_QUALITY });
    } else if (ext === '.gif') {
      // GIF не сжимаем, может потерять анимацию
      logger.debug('Skipping compression for GIF');
      return filePath;
    }
    
    await sharpPipeline.toFile(tempPath);
    
    // Проверяем размер после сжатия
    const compressedSize = getFileSize(tempPath);
    
    if (compressedSize < fileSize) {
      // Заменяем оригинал сжатым
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);
      logger.info(`Compressed ${Math.round(fileSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB`);
    } else {
      // Сжатие не помогло, удаляем темп
      fs.unlinkSync(tempPath);
    }
    
    return filePath;
  } catch (error) {
    logger.error('Error compressing image:', { path: filePath, error: error.message });
    // Возвращаем оригинальный путь даже при ошибке
    return filePath;
  }
};

/**
 * Получить информацию о файле
 */
export const getFileInfo = (filePath) => {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  return {
    size: stats.size,
    extension: ext,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime
  };
};

/**
 * Очистить старые файлы (старше maxAge мс)
 */
export const cleanupOldFiles = async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const now = Date.now();
    const files = fs.readdirSync(NEWS_IMAGES_DIR);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(NEWS_IMAGES_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        // Проверяем, используется ли файл в каких-либо новостях
        // Это нужно реализовать отдельно через проверку БД
        // Пока просто логируем
        logger.debug(`Old file found: ${file} (${Math.round((now - stats.mtimeMs) / 86400000)} days)`);
        // deleteFile(filePath); // Раскомментировать для реальной очистки
        // deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`Cleanup completed: ${deletedCount} files deleted`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Error during cleanup:', { error: error.message });
    return 0;
  }
};

/**
 * Транслитерация русского текста в латиницу
 */
export const transliterate = (text) => {
  const converter = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  return text.replace(/[а-яёА-ЯЁ]/g, char => converter[char] || char);
};

export default {
  ensureDirectoryExists,
  initUploadDirectories,
  getNewsImagesDir,
  getAvatarsDir,
  getVideosDir,
  getVideoThumbsDir,
  getVideoTempDir,
  getPublicUrl,
  fileExists,
  deleteFile,
  getFileSize,
  compressImageIfNeeded,
  getFileInfo,
  cleanupOldFiles,
  transliterate
};
