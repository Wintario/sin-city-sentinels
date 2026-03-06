import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Конфигурация приложения
 * Примечание: process.env должен быть загружен в bootstrap.js ДО импорта этого модуля
 */
export const config = {
  // Сервер
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // База данных
  dbPath: process.env.DB_PATH || join(__dirname, '../../data/app.db'),
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Логирование
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Rate limiting (значения из .env для разработки)
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  loginRateLimitWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 минут
  loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 50, // 50 попыток
  registerRateLimitWindowMs: 60 * 60 * 1000,
  registerRateLimitMax: 3,
  commentRateLimitWindowMs: 60 * 1000,
  commentRateLimitMax: 10,
  reportRateLimitWindowMs: 60 * 60 * 1000,
  reportRateLimitMax: 5,

  // Валидация
  maxTitleLength: 200,
  maxContentLength: 50000,
  maxExcerptLength: 500,
  maxNameLength: 100,
  maxCommentLength: 2000,
  maxReportReasonLength: 500,
  maxEmojisInComment: 10,
  commentEditWindowMs: 10 * 60 * 1000, // 10 минут
  
  // Роли участников клана
  memberRoles: ['Глава клана', 'Офицер', 'Ветеран', 'Боец', 'Новобранец'],
  
  // Статусы участников
  memberStatuses: ['active', 'inactive', 'reserve']
};

export default config;
