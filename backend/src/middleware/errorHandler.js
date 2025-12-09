import { config } from '../config/config.js';

/**
 * Класс для кастомных ошибок API
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Централизованный обработчик ошибок
 */
export function errorHandler(err, req, res, next) {
  // Логирование ошибки
  console.error(`[ERROR] ${new Date().toISOString()}:`);
  console.error(`  Path: ${req.method} ${req.path}`);
  console.error(`  Message: ${err.message}`);
  
  if (config.nodeEnv === 'development') {
    console.error(`  Stack: ${err.stack}`);
  }
  
  // Если это наша кастомная ошибка
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details })
    });
  }
  
  // Ошибки валидации (например, от better-sqlite3)
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Database constraint violation',
      details: err.message
    });
  }
  
  // Ошибки парсинга JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON in request body'
    });
  }
  
  // Все остальные ошибки
  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
}

/**
 * Обёртка для async функций в Express
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default { ApiError, errorHandler, asyncHandler };
