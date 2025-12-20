import { getDatabase } from './db.js';

/**
 * Инициализация таблиц базы данных
 */
export function runMigrations() {
  const db = getDatabase();

  try {
    // Проверяем существует ли таблица page_views
    const pageViewsExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='page_views'"
    ).get();

    if (!pageViewsExists) {
      console.log('📝 Creating page_views table...');
      db.exec(`
        CREATE TABLE page_views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_type TEXT NOT NULL,
          page_id INTEGER NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ page_views table created');
    }

    // Проверяем существует ли колонка views_count в таблице news
    const newsTable = db.prepare(
      "PRAGMA table_info(news)"
    ).all();

    const hasViewsCount = newsTable.some(col => col.name === 'views_count');

    if (!hasViewsCount) {
      console.log('📝 Adding views_count column to news table...');
      db.exec(`
        ALTER TABLE news ADD COLUMN views_count INTEGER DEFAULT 0
      `);
      console.log('✅ views_count column added to news table');
    }

    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  }
}
