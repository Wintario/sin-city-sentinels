import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { config } from '../config/config.js';
import { runMigrations } from './migrations.js';

let db = null;

/**
 * Инициализация базы данных SQLite
 */
export function initDatabase() {
  if (db) return db;

  // Создаём директорию для БД, если её нет
  const dbDir = dirname(config.dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created database directory: ${dbDir}`);
  }

  // Подключаемся к БД (создаётся автоматически, если не существует)
  db = new Database(config.dbPath);

  // Включаем foreign keys
  db.pragma('foreign_keys = ON');

  // Оптимизации для production
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  const absolutePath = resolve(config.dbPath);
  console.log(`✅ Database connected: ${config.dbPath}`);
  console.log(`📍 Absolute path: ${absolutePath}`);

  // Запускаем миграции
  runMigrations();

  // Очищаем осиротевшие профили (на случай если CASCADE не сработал)
  import('../models/userProfile.js').then(({ cleanupOrphanProfiles }) => {
    const orphanCount = cleanupOrphanProfiles();
    if (orphanCount > 0) {
      console.log(`🧹 Cleaned up ${orphanCount} orphan user profiles`);
    }
  });

  return db;
}

/**
 * Получить экземпляр базы данных
 */
export function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Закрыть соединение с БД
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database connection closed');
  }
}

export default { initDatabase, getDatabase, closeDatabase };
