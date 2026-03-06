// ═══════════════════════════════════════════════════════════════════════════════
// ОСНОВНОЙ КОД
// ═══════════════════════════════════════════════════════════════════════════════
// Примечание: dotenv загружается в bootstrap.js ДО импорта server.js
// Этот файл импортируется из bootstrap.js где process.env уже настроен

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { dirname } from 'path';

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
import commentRoutes from './src/routes/commentRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import commentAdminRoutes from './src/routes/commentAdminRoutes.js';
import { initDatabase } from './src/db/db.js';
import { initUploadDirectories } from './src/utils/fileUtils.js';

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
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://vk.com", "https://rutube.ru"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"]
    }
  }
}));

// CORS настройки
// При использовании credentials нельзя указывать '*', нужно явно указать origins
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = corsOrigins.includes('*');

// Основная CORS конфигурация для всех маршрутов
const corsOptions = {
  origin: allowAllOrigins ? '*' : function (origin, callback) {
    // Разрешить запросы без origin (mobile apps, POST requests)
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Отдельная CORS конфигурация для /api/proxy (разрешаем все origins для публичных данных)
app.use('/api/proxy', cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Парсинг JSON тела запросов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting для всех API запросов
app.use('/api/', apiLimiter);

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/comments', commentAdminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/about-cards', aboutCardsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🐰 Sin City Sentinels backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API info: http://localhost:${PORT}/api`);
  console.log(`\n🔒 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Обработка сигналов завершения для корректного закрытия сервера
// Проверка PID защищает от случайного завершения процесса
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  // Защита от повторного вызова
  if (isShuttingDown) {
    console.log('⚠️  Уже выполняется завершение работы, игнорируем повторный сигнал');
    return;
  }
  isShuttingDown = true;
  
  console.log(`\n📶 Получен сигнал ${signal} (PID: ${process.pid}). Корректное завершение работы...`);

  server.close(async (err) => {
    if (err) {
      console.error('❌ Ошибка при закрытии сервера:', err);
      process.exit(1);
    }

    console.log('✅ Сервер остановлен');

    // Закрываем соединения с базой данных если есть
    try {
      const { getDatabase } = await import('./src/db/db.js');
      const db = getDatabase();
      if (db) {
        db.close();
        console.log('✅ База данных закрыта');
      }
    } catch (e) {
      // Игнорируем ошибки при закрытии БД
    }

    console.log('✅ Завершение работы завершено');
    process.exit(0);
  });

  // Принудительное завершение через 10 секунд
  setTimeout(() => {
    console.error('⚠️  Принудительное завершение работы (timeout 10s)');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Обработка не пойманных ошибок
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
export { server };
