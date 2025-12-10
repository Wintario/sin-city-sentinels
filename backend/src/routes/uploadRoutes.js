import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { join, extname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Директория для загрузки изображений
const uploadsDir = '/var/www/rabbits/public/uploads';

// Создаём директорию, если её нет
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Конфигурация multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Проверка типа файла
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// POST /api/upload - Загрузить изображение
router.post('/', auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Генерируем URL для доступа к файлу
  const imageUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    image_url: imageUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

export default router;