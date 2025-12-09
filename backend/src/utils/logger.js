import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к лог-файлу: backend/logs/app.log
const logsDir = path.join(__dirname, '../../logs');
const logFile = path.join(logsDir, 'app.log');

// Создаём директорию logs если её нет
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Уровни логирования
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Форматирование сообщения для лога
 */
function formatLogMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    if (data instanceof Error) {
      logEntry += `\n  Error: ${data.message}`;
      if (data.stack) {
        logEntry += `\n  Stack: ${data.stack}`;
      }
    } else if (typeof data === 'object') {
      logEntry += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    } else {
      logEntry += `\n  Data: ${data}`;
    }
  }
  
  return logEntry + '\n';
}

/**
 * Запись в лог-файл
 */
function writeToFile(logEntry) {
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

/**
 * Основная функция логирования
 */
function log(level, message, data = null) {
  const logEntry = formatLogMessage(level, message, data);
  
  // Вывод в консоль
  if (level === LogLevel.ERROR) {
    console.error(logEntry);
  } else if (level === LogLevel.WARN) {
    console.warn(logEntry);
  } else {
    console.log(logEntry);
  }
  
  // Запись в файл
  writeToFile(logEntry);
}

/**
 * Экспортируемые функции логирования
 */
export const logger = {
  debug: (message, data) => log(LogLevel.DEBUG, message, data),
  info: (message, data) => log(LogLevel.INFO, message, data),
  warn: (message, data) => log(LogLevel.WARN, message, data),
  error: (message, data) => log(LogLevel.ERROR, message, data),
  
  // Специальный метод для HTTP запросов
  request: (req, message = 'HTTP Request') => {
    log(LogLevel.INFO, message, {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      user: req.user ? { id: req.user.id, username: req.user.username } : null
    });
  },
  
  // Путь к лог-файлу (для справки)
  getLogFilePath: () => logFile
};

export default logger;
