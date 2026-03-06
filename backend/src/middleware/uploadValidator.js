import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../utils/logger.js';
import { getNewsImagesDir, getVideoTempDir } from '../utils/fileUtils.js';

// Size limits
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
export const MAX_HEADER_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

// Allowed image formats
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Allowed video formats
export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska'
];
export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv'];

export const UPLOAD_RATE_LIMIT = {
  max: 10,
  windowMs: 60 * 1000,
  message: 'Слишком много загрузок. Попробуйте через минуту.'
};

const validateMimeType = (file) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Недопустимый формат файла. Разрешены: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
};

const validateExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Недопустимое расширение файла. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
};

const validateVideoMimeType = (file) => {
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Недопустимый формат видео. Разрешены: ${ALLOWED_VIDEO_MIME_TYPES.join(', ')}`);
  }
};

const validateVideoExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
    throw new Error(`Недопустимое расширение видео. Разрешены: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`);
  }
};

export const generateSafeFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase();
  const uuid = uuidv4();
  const timestamp = Date.now();
  const safeName = originalname
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\-_]/g, '_')
    .substring(0, 50);

  return `${timestamp}_${uuid}_${safeName}${ext}`;
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getNewsImagesDir());
  },
  filename: (req, file, cb) => {
    try {
      validateMimeType(file);
      validateExtension(file.originalname);
      cb(null, generateSafeFilename(file.originalname));
    } catch (error) {
      logger.error('Upload validation error', {
        error: error.message,
        file: file.originalname
      });
      cb(error);
    }
  }
});

const videoTempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getVideoTempDir());
  },
  filename: (req, file, cb) => {
    try {
      validateVideoMimeType(file);
      validateVideoExtension(file.originalname);
      cb(null, generateSafeFilename(file.originalname));
    } catch (error) {
      logger.error('Video upload validation error', {
        error: error.message,
        file: file.originalname
      });
      cb(error);
    }
  }
});

const imageFileFilter = (req, file, cb) => {
  try {
    validateMimeType(file);
    validateExtension(file.originalname);
    cb(null, true);
  } catch (error) {
    logger.warn('Image file rejected', {
      error: error.message,
      filename: file.originalname,
      mimetype: file.mimetype
    });
    cb(new Error(error.message), false);
  }
};

const videoFileFilter = (req, file, cb) => {
  try {
    validateVideoMimeType(file);
    validateVideoExtension(file.originalname);
    cb(null, true);
  } catch (error) {
    logger.warn('Video file rejected', {
      error: error.message,
      filename: file.originalname,
      mimetype: file.mimetype
    });
    cb(new Error(error.message), false);
  }
};

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

export const uploadHeaderImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_HEADER_IMAGE_SIZE,
    files: 1
  }
});

export const uploadVideo = multer({
  storage: videoTempStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
    files: 1
  }
});

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.warn('Multer error', { code: err.code, message: err.message });

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        if (req.path.includes('/video')) {
          return res.status(400).json({
            error: `Видео слишком большое. Максимальный размер: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`
          });
        }
        return res.status(400).json({
          error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        });
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILES':
        return res.status(400).json({
          error: req.path.includes('/video')
            ? 'Можно загрузить только одно видео за раз.'
            : 'Слишком много файлов. Максимум 5 за раз.'
        });
      default:
        return res.status(400).json({
          error: `Ошибка загрузки: ${err.message}`
        });
    }
  }

  if (err) {
    logger.error('Upload error', { error: err.message });
    return res.status(400).json({
      error: err.message
    });
  }

  next();
};

export default {
  uploadImage,
  uploadHeaderImage,
  uploadVideo,
  handleMulterError,
  MAX_FILE_SIZE,
  MAX_HEADER_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES
};
