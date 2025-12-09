import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  
  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 минут
  rateLimitMax: 100,
  loginRateLimitWindowMs: 1 * 60 * 1000, // 1 минута
  loginRateLimitMax: 5,
  
  // Валидация
  maxTitleLength: 200,
  maxContentLength: 50000,
  maxExcerptLength: 500,
  maxNameLength: 100,
  
  // Роли участников клана
  memberRoles: ['Глава клана', 'Офицер', 'Ветеран', 'Боец', 'Новобранец'],
  
  // Статусы участников
  memberStatuses: ['active', 'inactive', 'reserve']
};

export default config;
