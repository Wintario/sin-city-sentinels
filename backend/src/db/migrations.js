import { getDatabase } from './db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Инициализация таблиц базы данных
 */
export function runMigrations() {
  const db = getDatabase();

  try {
    // ============================================
    // Миграция 001: Базовая схема аутентификации и комментариев
    // ============================================
    const migration001Exists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).get();

    if (!migration001Exists) {
      console.log('>> Running migration 001: Auth and Comments schema...');
      const migrationPath = join(__dirname, '../../migrations/001_auth_and_comments.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      db.exec(migrationSQL);
      console.log('>> Migration 001 completed: users, user_profiles, comments, etc.');
    } else {
      console.log('>> Migration 001 table exists, checking schema...');

      // Проверяем и добавляем недостающие колонки в таблицу users
      const usersTable = db.prepare("PRAGMA table_info(users)").all();
      const existingColumns = usersTable.map(col => col.name);

      const requiredUserColumns = [
        { name: 'email', sql: 'TEXT', default: null },
        { name: 'password_hash', sql: 'TEXT', default: null },
        { name: 'role', sql: "TEXT DEFAULT 'user'", default: "'user'" },
        { name: 'is_active', sql: 'INTEGER DEFAULT 1', default: '1' }
      ];

      let userColumnsAdded = 0;
      for (const col of requiredUserColumns) {
        if (!existingColumns.includes(col.name)) {
          console.log(`  >> Adding column '${col.name}' to users table...`);
          // Для NOT NULL колонок нужно указать временное значение по умолчанию
          db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.sql}`);
          userColumnsAdded++;
        }
      }

      // Добавляем колонку is_deleted для мягкого удаления пользователей
      const hasIsDeleted = existingColumns.includes('is_deleted');
      if (!hasIsDeleted) {
        console.log(`  >> Adding column 'is_deleted' to users table...`);
        db.exec(`ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0`);
      }

      if (userColumnsAdded > 0) {
        console.log(`>> Added ${userColumnsAdded} column(s) to users table`);

        // Добавляем UNIQUE индекс на email после добавления колонки
        try {
          db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
          console.log('>> Created unique index on users.email');
        } catch (e) {
          // Индекс может не создаться если есть дубликаты email
          console.log('!! Could not create unique index on email (may have duplicates)');
        }
      } else {
        console.log('>> Users table schema is up to date');
      }
    }

    // ============================================
    // Проверяем существование таблицы user_profiles
    // ============================================
    const userProfilesExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles'"
    ).get();

    if (!userProfilesExists) {
      console.log('>> Creating user_profiles table...');
      db.exec(`
        CREATE TABLE user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          arena_nickname TEXT NOT NULL,
          character_url TEXT NOT NULL,
          character_image TEXT,
          clan_name TEXT,
          clan_url TEXT,
          clan_icon TEXT,
          is_target_clan_member INTEGER DEFAULT 0,
          clan_checked_at DATETIME,
          email_verified INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('>> user_profiles table created');
    } else {
      // Проверяем и добавляем колонку character_image если её нет
      const userProfilesTable = db.prepare("PRAGMA table_info(user_profiles)").all();
      const existingColumns = userProfilesTable.map(col => col.name);

      if (!existingColumns.includes('character_image')) {
        console.log('>> Adding column character_image to user_profiles...');
        db.exec('ALTER TABLE user_profiles ADD COLUMN character_image TEXT');
        console.log('>> Added character_image column to user_profiles');
      }

      if (!existingColumns.includes('clan_name')) {
        console.log('>> Adding column clan_name to user_profiles...');
        db.exec('ALTER TABLE user_profiles ADD COLUMN clan_name TEXT');
        console.log('>> Added clan_name column to user_profiles');
      }

      if (!existingColumns.includes('clan_url')) {
        console.log('>> Adding column clan_url to user_profiles...');
        db.exec('ALTER TABLE user_profiles ADD COLUMN clan_url TEXT');
        console.log('>> Added clan_url column to user_profiles');
      }

      if (!existingColumns.includes('clan_icon')) {
        console.log('>> Adding column clan_icon to user_profiles...');
        db.exec('ALTER TABLE user_profiles ADD COLUMN clan_icon TEXT');
        console.log('>> Added clan_icon column to user_profiles');
      }

      if (!existingColumns.includes('is_target_clan_member')) {
        console.log('>> Adding column is_target_clan_member to user_profiles...');
        db.exec('ALTER TABLE user_profiles ADD COLUMN is_target_clan_member INTEGER DEFAULT 0');
        console.log('>> Added is_target_clan_member column to user_profiles');
      }

      if (!existingColumns.includes('clan_checked_at')) {
        console.log('>> Adding column clan_checked_at to user_profiles...');
        db.exec('ALTER TABLE user_profiles ADD COLUMN clan_checked_at DATETIME');
        console.log('>> Added clan_checked_at column to user_profiles');
      }
    }

    // ============================================
    // Проверяем существование таблицы email_verification_tokens
    // ============================================
    const emailVerificationTokensExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='email_verification_tokens'"
    ).get();

    if (!emailVerificationTokensExists) {
      console.log('>> Creating email_verification_tokens table...');
      db.exec(`
        CREATE TABLE email_verification_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('>> email_verification_tokens table created');
    }

    // ============================================
    // Проверяем существование таблицы password_reset_tokens
    // ============================================
    const passwordResetTokensExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='password_reset_tokens'"
    ).get();

    if (!passwordResetTokensExists) {
      console.log('>> Creating password_reset_tokens table...');
      db.exec(`
        CREATE TABLE password_reset_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          used INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('>> password_reset_tokens table created');
    }

    // ============================================
    // Проверяем существование таблицы comments
    // ============================================
    const commentsExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='comments'"
    ).get();

    if (!commentsExists) {
      console.log('>> Creating comments table...');
      db.exec(`
        CREATE TABLE comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          news_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          parent_id INTEGER,
          content TEXT NOT NULL,
          is_deleted INTEGER DEFAULT 0,
          is_hidden INTEGER DEFAULT 0,
          hidden_by INTEGER,
          hidden_at DATETIME,
          hidden_reason TEXT,
          edited_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME,
          FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
        )
      `);
      console.log('>> comments table created');
    } else {
      // Проверяем и добавляем недостающие колонки в comments
      const commentsTable = db.prepare("PRAGMA table_info(comments)").all();
      const existingCommentColumns = commentsTable.map(col => col.name);

      const requiredCommentColumns = [
        { name: 'is_hidden', sql: 'INTEGER DEFAULT 0' },
        { name: 'hidden_by', sql: 'INTEGER' },
        { name: 'hidden_at', sql: 'DATETIME' },
        { name: 'hidden_reason', sql: 'TEXT' },
        { name: 'edited_at', sql: 'DATETIME' },
        { name: 'deleted_at', sql: 'DATETIME' }
      ];

      let commentColumnsAdded = 0;
      for (const col of requiredCommentColumns) {
        if (!existingCommentColumns.includes(col.name)) {
          console.log(`  >> Adding column '${col.name}' to comments table...`);
          db.exec(`ALTER TABLE comments ADD COLUMN ${col.name} ${col.sql}`);
          commentColumnsAdded++;
        }
      }

      if (commentColumnsAdded > 0) {
        console.log(`>> Added ${commentColumnsAdded} column(s) to comments table`);
      } else {
        console.log('>> Comments table schema is up to date');
      }
    }

    // ============================================
    // Проверяем существование таблицы comment_reports
    // ============================================
    const commentReportsExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='comment_reports'"
    ).get();

    if (!commentReportsExists) {
      console.log('>> Creating comment_reports table...');
      db.exec(`
        CREATE TABLE comment_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          reviewed_by INTEGER,
          reviewed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('>> comment_reports table created');
    }

    // ============================================
    // Проверяем существование таблицы comment_edits
    // ============================================
    const commentEditsExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='comment_edits'"
    ).get();

    if (!commentEditsExists) {
      console.log('>> Creating comment_edits table...');
      db.exec(`
        CREATE TABLE comment_edits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comment_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          old_content TEXT NOT NULL,
          edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('>> comment_edits table created');
    }

    // ============================================
    // Миграция 002: Page views и счетчики просмотров
    // ============================================
    // Проверяем существует ли таблица page_views
    const pageViewsExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='page_views'"
    ).get();

    if (!pageViewsExists) {
      console.log('>> Creating page_views table...');
      db.exec(`
        CREATE TABLE page_views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          page_type TEXT NOT NULL,
          page_id INTEGER NOT NULL,
          user_id INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('>> page_views table created');
    } else {
      // Проверяем, есть ли колонка user_id (для старых БД)
      const columns = db.prepare("PRAGMA table_info(page_views)").all();
      const hasUserId = columns.some(col => col.name === 'user_id');

      if (!hasUserId) {
        console.log('>> Adding user_id column to page_views table...');
        db.exec(`
          ALTER TABLE page_views ADD COLUMN user_id INTEGER
        `);
        console.log('>> user_id column added to page_views table');
      }
    }

    // Проверяем существует ли колонка views_count в таблице news
    // Сначала проверяем существует ли сама таблица
    const newsTableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='news'"
    ).get();

    if (newsTableExists) {
      const newsTable = db.prepare(
        "PRAGMA table_info(news)"
      ).all();

      const hasViewsCount = newsTable.some(col => col.name === 'views_count');
      const hasHeaderImageMeta = newsTable.some(col => col.name === 'header_image_meta');

      if (!hasViewsCount) {
        console.log('>> Adding views_count column to news table...');
        db.exec(`
          ALTER TABLE news ADD COLUMN views_count INTEGER DEFAULT 0
        `);
        console.log('>> views_count column added to news table');
      }

      if (!hasHeaderImageMeta) {
        console.log('>> Adding header_image_meta column to news table...');
        db.exec(`
          ALTER TABLE news ADD COLUMN header_image_meta TEXT
        `);
        console.log('>> header_image_meta column added to news table');
      }
    }

    // ============================================
    // Миграция 003: Character verification tokens
    // ============================================
    const charVerificationTokensExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='character_verification_tokens'"
    ).get();

    if (!charVerificationTokensExists) {
      console.log('>> Creating character_verification_tokens table...');
      db.exec(`
        CREATE TABLE character_verification_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL DEFAULT 'registration',
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_char_verification_token ON character_verification_tokens(token)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_char_verification_user ON character_verification_tokens(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_char_verification_type ON character_verification_tokens(type)`);
      console.log('>> character_verification_tokens table created');
    }

    // ============================================
    // Миграция 003b: Pending character registrations
    // ============================================
    const pendingCharacterRegsExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pending_character_registrations'"
    ).get();

    if (!pendingCharacterRegsExists) {
      console.log('>> Creating pending_character_registrations table...');
      db.exec(`
        CREATE TABLE pending_character_registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          character_url TEXT NOT NULL,
          character_name TEXT NOT NULL,
          character_image TEXT,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_pending_char_reg_token ON pending_character_registrations(token)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_pending_char_reg_username ON pending_character_registrations(username)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_pending_char_reg_character_url ON pending_character_registrations(character_url)`);
      console.log('>> pending_character_registrations table created');
    }

    // ============================================
    // Миграция 004: User bans (временные блокировки)
    // ============================================
    const userBansExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_bans'"
    ).get();

    if (!userBansExists) {
      console.log('>> Creating user_bans table...');
      db.exec(`
        CREATE TABLE user_bans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          banned_by INTEGER,
          ban_reason TEXT,
          ban_start DATETIME DEFAULT CURRENT_TIMESTAMP,
          ban_end DATETIME,
          is_permanent INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_user_bans_user ON user_bans(user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_user_bans_active ON user_bans(is_active)`);
      console.log('>> user_bans table created');
    }

    console.log('>> Database migrations completed');
  } catch (error) {
    console.error('!! Migration error:', error.message);
    throw error;
  }
}
