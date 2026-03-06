/**
 * Скрипт для применения миграции 003
 * Добавляет индексы для улучшения производительности комментариев
 */

import { getDatabase } from '../src/db/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runMigration() {
  const db = getDatabase();
  
  console.log('Applying migration 003: comments indexes...');
  
  try {
    // Читаем SQL файл миграции
    const migrationPath = join(__dirname, '..', 'migrations', '003_comments_indexes.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Разделяем SQL на отдельные команды
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    // Выполняем каждую команду отдельно
    for (const command of commands) {
      try {
        // Пропускаем ALTER TABLE если колонка уже существует
        if (command.includes('ALTER TABLE comments ADD COLUMN deleted_at')) {
          const columnExists = db
            .prepare("PRAGMA table_info(comments)")
            .all()
            .some(col => col.name === 'deleted_at');
          
          if (columnExists) {
            console.log('⚠️  Column deleted_at already exists, skipping...');
            continue;
          }
        }
        
        db.exec(command);
      } catch (error) {
        // Игнорируем ошибки дублирования индексов
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate column name')) {
          console.log(`⚠️  ${error.message.split(':')[0]}, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration 003 completed successfully');
    
    // Проверяем созданные индексы
    const indexes = db.prepare(`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
    `).all();
    
    console.log('Indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name} on ${idx.tbl_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Запуск миграции
runMigration();
