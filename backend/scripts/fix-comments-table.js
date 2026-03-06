/**
 * Скрипт для исправления таблицы comments
 * Добавляет отсутствующие колонки
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/app.db');
const db = new Database(dbPath);

console.log('📊 Проверяем таблицу comments...');

// Получаем текущую структуру таблицы
const tableInfo = db.prepare("PRAGMA table_info(comments)").all();
const columnNames = tableInfo.map(col => col.name);

console.log('Текущие колонки:', columnNames);

// Колонки, которые должны быть
const requiredColumns = [
  'id', 'news_id', 'user_id', 'parent_id', 'content',
  'is_deleted', 'is_hidden', 'hidden_by', 'hidden_at', 'hidden_reason',
  'edited_at', 'created_at', 'deleted_at'
];

// Проверяем и добавляем отсутствующие колонки
const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

if (missingColumns.length > 0) {
  console.log('❌ Отсутствуют колонки:', missingColumns);
  console.log('📝 Добавляем отсутствующие колонки...');

  // Отключаем foreign keys на время изменений
  db.pragma('foreign_keys = OFF');

  for (const col of missingColumns) {
    try {
      let defaultVal = '';
      if (col.startsWith('is_')) {
        defaultVal = 'DEFAULT 0';
      } else if (col.endsWith('_at')) {
        defaultVal = col === 'created_at' ? "DEFAULT CURRENT_TIMESTAMP" : '';
      }

      const sql = defaultVal
        ? `ALTER TABLE comments ADD COLUMN ${col} ${defaultVal}`
        : `ALTER TABLE comments ADD COLUMN ${col}`;

      console.log(`  Выполняем: ${sql}`);
      db.exec(sql);
      console.log(`  ✅ Добавлена колонка ${col}`);
    } catch (error) {
      console.error(`  ❌ Ошибка при добавлении ${col}:`, error.message);
    }
  }

  // Включаем foreign keys обратно
  db.pragma('foreign_keys = ON');

  console.log('✅ Таблица comments исправлена');
} else {
  console.log('✅ Все колонки на месте');
}

// Проверяем индексы
console.log('\n📊 Проверяем индексы...');
const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='comments'").all();
console.log('Существующие индексы:', indexes.map(i => i.name));

const requiredIndexes = [
  'idx_comments_news',
  'idx_comments_user',
  'idx_comments_created',
  'idx_comments_parent'
];

for (const idx of requiredIndexes) {
  const exists = indexes.some(i => i.name === idx);
  if (!exists) {
    try {
      let indexSql = '';
      switch (idx) {
        case 'idx_comments_news':
          indexSql = 'CREATE INDEX idx_comments_news ON comments(news_id, is_hidden, is_deleted)';
          break;
        case 'idx_comments_user':
          indexSql = 'CREATE INDEX idx_comments_user ON comments(user_id)';
          break;
        case 'idx_comments_created':
          indexSql = 'CREATE INDEX idx_comments_created ON comments(created_at DESC)';
          break;
        case 'idx_comments_parent':
          indexSql = 'CREATE INDEX idx_comments_parent ON comments(parent_id)';
          break;
      }
      if (indexSql) {
        console.log(`  Создаём индекс: ${idx}`);
        db.exec(indexSql);
      }
    } catch (error) {
      console.error(`  ❌ Ошибка при создании индекса ${idx}:`, error.message);
    }
  }
}

// Проверяем другие таблицы
const requiredTables = ['user_profiles', 'comment_reports', 'email_verification_tokens', 'comment_edits'];
for (const table of requiredTables) {
  const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
  if (!exists) {
    console.log(`\n📝 Создаём таблицу ${table}...`);
    try {
      const migrationPath = join(__dirname, '../migrations/002_add_comments_system.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      db.exec(migrationSQL);
      console.log(`  ✅ Таблица ${table} создана`);
      break; // Миграция создаёт все таблицы сразу
    } catch (error) {
      console.error(`  ❌ Ошибка:`, error.message);
    }
  } else {
    console.log(`✅ Таблица ${table} существует`);
  }
}

db.close();
console.log('\n✅ Готово!');
