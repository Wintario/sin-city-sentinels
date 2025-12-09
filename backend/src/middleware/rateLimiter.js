import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

/**
 * Жёсткий лимит для попыток входа
 * Макс 5 попыток в минуту
 */
export const loginLimiter = rateLimit({
  windowMs: config.loginRateLimitWindowMs, // 1 минута
  max: config.loginRateLimitMax, // 5 попыток
  message: { 
    error: 'Слишком много попыток входа. Попробуйте через минуту.',
    retryAfter: Math.ceil(config.loginRateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Не считаем успешные входы
});

/**
 * Общий лимит для API запросов
 * 100 запросов за 15 минут
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 15 минут
  max: config.rateLimitMax, // 100 запросов
  message: { 
    error: 'Слишком много запросов. Попробуйте позже.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Лимит для операций создания/изменения
 * 30 запросов за 15 минут
 */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 30,
  message: { 
    error: 'Слишком много операций записи. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default { loginLimiter, apiLimiter, writeLimiter };
