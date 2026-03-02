import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { errorHandler } from './src/middleware/errorHandler.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import authRoutes from './src/routes/authRoutes.js';
import newsRoutes from './src/routes/newsRoutes.js';
import membersRoutes from './src/routes/membersRoutes.js';
import usersRoutes from './src/routes/usersRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import aboutCardsRoutes from './src/routes/aboutCardsRoutes.js';
import statsRoutes from './src/routes/statsRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import proxyRoutes from './src/routes/proxyRoutes.js';
import { initDatabase } from './src/db/db.js';
import { initUploadDirectories } from './src/utils/fileUtils.js';

// Загрузка переменных окружения
// В production режиме используем .env.production
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Инициализация базы данных
initDatabase();

// Инициализация директорий для загрузок
initUploadDirectories();

// Trust proxy для корректной работы X-Forwarded-For заголовка (Nginx)
app.set('trust proxy', 1);

// Безопасность: установка HTTP заголовков
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"]
    }
  }
}));

// CORS настройки
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Парсинг JSON тела запросов
app.use(express.json({ limit: '10mb' }));

// Выдача статических файлов для загрузок (изображения новостей, аватарки)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Выдача статических файлов (аватарки членов клана) - для совместимости
app.use('/avatars', express.static('/var/www/rabbits/public/avatars'));

// Выдача info.gif для импорта персонажей
app.use('/static', express.static(join(__dirname, 'static')));

// Rate limiting для всех API запросов
app.use('/api/', apiLimiter);

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/about-cards', aboutCardsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check эндпоинт
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Sin City Sentinels API'
  });
});

// API информация
app.get('/api', (req, res) => {
  res.json({
    name: 'Sin City Sentinels API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      news: '/api/news',
      members: '/api/members',
      stats: '/api/stats',
      upload: '/api/upload'
    }
  });
});

// 404 для неизвестных маршрутов
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Централизованная обработка ошибок (должна быть последней!)
app.use(errorHandler);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🐰 Sin City Sentinels backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API info: http://localhost:${PORT}/api`);
  console.log(`\n🔒 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;