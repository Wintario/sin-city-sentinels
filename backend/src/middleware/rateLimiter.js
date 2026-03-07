import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

/**
 * Лимит для попыток входа - более лояльный
 * 50 попыток за 15 минут (около 3 попыток в минуту)
 */
export const loginLimiter = rateLimit({
  windowMs: config.loginRateLimitWindowMs, // 15 минут
  max: config.loginRateLimitMax, // 50 попыток
  message: {
    error: 'Слишком много попыток входа. Попробуйте через 15 минут.',
    retryAfter: Math.ceil(config.loginRateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные входы
  skip: (req) => {
    // Пропускаем верификацию токена - это не попытка входа
    return req.path === '/verify-token' || req.path === '/me';
  }
});

/**
 * Лимит для регистрации
 * 3 регистрации в час
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3,
  message: {
    error: 'Слишком много регистраций. Попробуйте позже.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Лимит для отправки верификации email
 * 3 запроса в час
 */
export const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 3,
  message: {
    error: 'Слишком много запросов верификации. Попробуйте позже.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Лимит для комментариев
 * 10 комментариев в минуту
 */
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10,
  message: {
    error: 'Слишком много комментариев. Попробуйте через минуту.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Лимит для жалоб
 * 5 жалоб в час
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 5,
  message: {
    error: 'Слишком много жалоб. Попробуйте позже.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
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
  legacyHeaders: false,
  skip: (req) => {
    // Публичные новости не ограничиваем общим API лимитом, чтобы не ломать ленту при активной навигации
    if (req.method === 'GET' && req.originalUrl?.startsWith('/api/news')) {
      return true;
    }

    if (config.nodeEnv === 'production') return false;
    const ip = req.ip || '';
    const host = req.hostname || '';
    return (
      ip === '::1' ||
      ip.includes('127.0.0.1') ||
      ip.includes('::ffff:127.0.0.1') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  }
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

export default {
  loginLimiter,
  registerLimiter,
  verificationLimiter,
  commentLimiter,
  reportLimiter,
  apiLimiter,
  writeLimiter
};

