import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// КОНФИГУРАЦИЯ ОГРАНИЧЕНИЙ
// ============================================

// Максимальные размеры файлов
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB для обычных изображений
export const MAX_HEADER_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB для шапки новости
export const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB общий лимит

// Разрешённые MIME-типы
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Разрешённые расширения
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Rate limiting конфигурация
export const UPLOAD_RATE_LIMIT = {
  max: 10, // запросов
  windowMs: 60 * 1000, // в минуту
  message: 'Слишком много загрузок. Попробуйте через минуту.'
};

// ============================================
// ФУНКЦИИ ВАЛИДАЦИИ
// ============================================

/**
 * Проверка MIME-типа файла
 */
const validateMimeType = (file) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Недопустимый формат файла. Разрешены: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  return true;
};

/**
 * Проверка расширения файла
 */
const validateExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Недопустимое расширение файла. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  return true;
};

/**
 * Генерация безопасного имени файла
 */
export const generateSafeFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const uuid = uuidv4();
  const timestamp = Date.now();
  
  // Удаляем все спецсимволы из оригинального имени
  const safeName = originalname
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_]/g, '_')
    .substring(0, 50);
  
  return `${timestamp}_${uuid}_${safeName}${ext}`;
};

// ============================================
// MULTER НАСТРОЙКИ
// ============================================

// Хранилище для обычных изображений
const createStorage = (maxSize) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads/news-images');
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      try {
        validateMimeType(file);
        validateExtension(file.originalname);
        const safeFilename = generateSafeFilename(file.originalname);
        cb(null, safeFilename);
      } catch (error) {
        logger.error('Upload validation error:', { 
          error: error.message, 
          file: file.originalname 
        });
        cb(error);
      }
    }
  });
};

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  try {
    validateMimeType(file);
    validateExtension(file.originalname);
    cb(null, true);
  } catch (error) {
    logger.warn('File filter rejected:', { 
      error: error.message, 
      filename: file.originalname,
      mimetype: file.mimetype 
    });
    cb(new Error(error.message), false);
  }
};

// ============================================
// MULTER ИНСТАНСЫ
// ============================================

// Для обычных изображений в контенте новости
export const uploadImage = multer({
  storage: createStorage(MAX_FILE_SIZE),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // макс. 5 файлов за раз
  }
});

// Для изображения шапки новости
export const uploadHeaderImage = multer({
  storage: createStorage(MAX_HEADER_IMAGE_SIZE),
  fileFilter,
  limits: {
    fileSize: MAX_HEADER_IMAGE_SIZE,
    files: 1
  }
});

// ============================================
// ОБРАБОТЧИК ОШИБОК MULTER
// ============================================

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.warn('Multer error:', { code: err.code, message: err.message });
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        });
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILES':
        return res.status(400).json({
          error: 'Слишком много файлов. Максимум 5 за раз.'
        });
      default:
        return res.status(400).json({
          error: `Ошибка загрузки: ${err.message}`
        });
    }
  }
  
  if (err) {
    logger.error('Upload error:', { error: err.message });
    return res.status(400).json({
      error: err.message
    });
  }
  
  next();
};

export default {
  uploadImage,
  uploadHeaderImage,
  handleMulterError,
  MAX_FILE_SIZE,
  MAX_HEADER_IMAGE_SIZE,
  ALLOWED_MIME_TYPES
};
