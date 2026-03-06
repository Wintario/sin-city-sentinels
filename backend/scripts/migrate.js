import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Загружаем .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/app.db');
const SALT_ROUNDS = 10;

console.log('🚀 Starting database migration...\n');

// Создаём директорию для БД
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log(`📁 Created directory: ${dbDir}`);
}

// Подключаемся к БД
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log(`📦 Database path: ${DB_PATH}\n`);

// ============================================
// Создание таблиц
// ============================================

console.log('📋 Creating tables...\n');

// Таблица users
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'author',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✅ Table "users" created');

// Таблица news (с is_archived)
db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    published_at DATETIME,
    author_id INTEGER NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  )
`);
console.log('  ✅ Table "news" created');

// Добавляем is_archived если не существует
try {
  db.exec(`ALTER TABLE news ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0`);
  console.log('  ✅ Column "is_archived" added to news');
} catch (e) {
  if (!e.message.includes('duplicate column')) {
    console.log('  ⏭️  Column "is_archived" already exists');
  }
}

// Таблица members (с is_leader)
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    profile_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    order_index INTEGER,
    is_leader INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✅ Table "members" created');

// Добавляем is_leader если не существует
try {
  db.exec(`ALTER TABLE members ADD COLUMN is_leader INTEGER NOT NULL DEFAULT 0`);
  console.log('  ✅ Column "is_leader" added to members');
} catch (e) {
  if (!e.message.includes('duplicate column')) {
    console.log('  ⏭️  Column "is_leader" already exists');
  }
}

// Таблица settings
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✅ Table "settings" created');

// Таблица about_cards
db.exec(`
  CREATE TABLE IF NOT EXISTS about_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    style_type TEXT NOT NULL DEFAULT 'comic-thick-frame',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✅ Table "about_cards" created');

// ============================================
// Создание индексов
// ============================================

console.log('\n📑 Creating indexes...\n');

db.exec(`CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_news_is_deleted ON news(is_deleted)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_news_is_archived ON news(is_archived)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_members_order ON members(order_index)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_members_is_leader ON members(is_leader)`);
console.log('  ✅ Indexes created');

// ============================================
// Создание дефолтных пользователей
// ============================================

console.log('\n👤 Creating default users...\n');

const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)
`);

const defaultUsers = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'author', password: 'author', role: 'author' }
];

for (const user of defaultUsers) {
  const existing = checkUser.get(user.username);
  if (!existing) {
    const hash = bcrypt.hashSync(user.password, SALT_ROUNDS);
    insertUser.run(user.username, hash, user.role);
    console.log(`  ✅ User "${user.username}" created (role: ${user.role})`);
  } else {
    console.log(`  ⏭️  User "${user.username}" already exists`);
  }
}

// ============================================
// Создание начальных участников клана
// ============================================

console.log('\n🐰 Creating initial clan members...\n');

const checkMembers = db.prepare('SELECT COUNT(*) as count FROM members');
const membersCount = checkMembers.get();

if (membersCount.count === 0) {
  const insertMember = db.prepare(`
    INSERT INTO members (name, role, profile_url, status, order_index, is_leader) VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const initialMembers = [
    { name: 'легион86', role: 'Глава клана', profile_url: 'https://kovcheg2.apeha.ru/info.html?user=201617408', status: 'active', order_index: 1, is_leader: 1 },
    { name: 'Рейдер', role: 'Офицер', profile_url: null, status: 'active', order_index: 2, is_leader: 0 },
    { name: 'Тень', role: 'Ветеран', profile_url: null, status: 'active', order_index: 3, is_leader: 0 },
    { name: 'Клык', role: 'Боец', profile_url: null, status: 'active', order_index: 4, is_leader: 0 },
    { name: 'Шторм', role: 'Боец', profile_url: null, status: 'active', order_index: 5, is_leader: 0 },
  ];
  
  for (const member of initialMembers) {
    insertMember.run(member.name, member.role, member.profile_url, member.status, member.order_index, member.is_leader);
    console.log(`  ✅ Member "${member.name}" created (${member.role})${member.is_leader ? ' [LEADER]' : ''}`);
  }
} else {
  console.log(`  ⏭️  Members table already has ${membersCount.count} entries`);
  
  // Убедимся что первый участник — лидер
  const firstMember = db.prepare('SELECT id, name, is_leader FROM members ORDER BY order_index ASC LIMIT 1').get();
  if (firstMember && !firstMember.is_leader) {
    db.prepare('UPDATE members SET is_leader = 0').run();
    db.prepare('UPDATE members SET is_leader = 1 WHERE id = ?').run(firstMember.id);
    console.log(`  ✅ Set "${firstMember.name}" as leader`);
  }
}

// ============================================
// Создание начальных новостей
// ============================================

console.log('\n📰 Creating initial news...\n');

const checkNews = db.prepare('SELECT COUNT(*) as count FROM news');
const newsCount = checkNews.get();

if (newsCount.count === 0) {
  const insertNews = db.prepare(`
    INSERT INTO news (title, slug, content, excerpt, author_id, published_at, is_archived) 
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);
  
  const initialNews = [
    {
      title: 'Добро пожаловать в логово Свирепых Кроликов!',
      slug: 'welcome-to-fierce-rabbits',
      content: `Мы — Свирепые Кролики. Мы величайшие. Мы боги.

С 2006 года мы несём страх и ужас по просторам АРЕНЫ. Наш клан — это не просто объединение игроков. Это братство сильнейших, закалённое в тысячах битв.

Если ты готов стать частью легенды — добро пожаловать. Но помни: только сильнейшие выживают в нашем логове.`,
      excerpt: 'Мы — Свирепые Кролики. Мы величайшие. Мы боги.',
      published_at: new Date().toISOString()
    },
    {
      title: 'Клан празднует 18 лет на АРЕНЕ!',
      slug: 'clan-18-years',
      content: `26 сентября 2024 года клан Свирепые Кролики отметил свой 18-й день рождения!

За эти годы мы прошли долгий путь от небольшой группы игроков до одного из самых известных кланов на сервере. Сотни побед, тысячи сражений, бесчисленные трофеи — всё это наша история.

Спасибо всем, кто был с нами все эти годы. Мы продолжаем нести знамя клана высоко!`,
      excerpt: 'Клан Свирепые Кролики отмечает 18 лет на АРЕНЕ!',
      published_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      title: 'Набор новых бойцов открыт',
      slug: 'recruitment-open',
      content: `Клан Свирепые Кролики объявляет набор новых членов!

Мы ищем:
- Активных игроков
- Готовых к командной работе
- С опытом PvP боёв

Если ты чувствуешь, что достоин носить наше имя — свяжись с любым офицером клана для прохождения испытания.

Помни: мы не принимаем слабых. Только сильнейшие становятся Свирепыми Кроликами.`,
      excerpt: 'Мы ищем новых бойцов в ряды клана!',
      published_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];
  
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  for (const news of initialNews) {
    insertNews.run(news.title, news.slug, news.content, news.excerpt, admin.id, news.published_at);
    console.log(`  ✅ News "${news.title.substring(0, 40)}..." created`);
  }
} else {
  console.log(`  ⏭️  News table already has ${newsCount.count} entries`);
}

// ============================================
// Начальные настройки фона
// ============================================

console.log('\n🎨 Creating initial settings...\n');

const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
`);

insertSetting.run('background_url', '/images/hero-rabbit.png');
insertSetting.run('bg_color', '#1a1a1a');
insertSetting.run('bg_opacity', '0.7');
console.log('  ✅ Background settings initialized');

// ============================================
// Миграция 002: Система комментариев
// ============================================

console.log('\n📋 Running migration 002: Comments system...\n');

// Функция для выполнения SQL миграции
function runMigration(filePath, description) {
  if (!existsSync(filePath)) {
    console.log(`  ⏭️  ${description} file not found`);
    return;
  }
  
  const sql = readFileSync(filePath, 'utf8');
  
  // Разбиваем на statements по ; с учётом многострочных CREATE TABLE
  const statements = [];
  let currentStmt = '';
  let inCreateTable = false;
  
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    
    // Пропускаем комментарии
    if (trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
    
    // Пустые строки
    if (trimmed === '') continue;
    
    // Проверяем начало CREATE TABLE
    if (trimmed.toUpperCase().includes('CREATE TABLE')) {
      inCreateTable = true;
    }
    
    currentStmt += line + '\n';
    
    // Если нашли ; и не внутри CREATE TABLE - это конец statement
    if (trimmed.endsWith(';') && !inCreateTable) {
      statements.push(currentStmt.trim());
      currentStmt = '';
      inCreateTable = false;
    }
    
    // Если нашли ); в CREATE TABLE - это конец
    if (inCreateTable && trimmed === ');') {
      statements.push(currentStmt.trim());
      currentStmt = '';
      inCreateTable = false;
    }
  }
  
  // Выполняем каждый statement
  let success = 0;
  let skipped = 0;
  
  for (const stmt of statements) {
    try {
      db.exec(stmt);
      success++;
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
        skipped++;
      } else {
        console.log(`  ⚠️  Error: ${e.message}`);
        console.log(`     Statement: ${stmt.substring(0, 100)}...`);
      }
    }
  }
  
  console.log(`  ✅ ${description}: ${success} executed, ${skipped} skipped`);
}

runMigration(join(__dirname, '../migrations/002_add_comments_tables.sql'), 'Tables (migration 002)');
runMigration(join(__dirname, '../migrations/002_add_comments_indexes.sql'), 'Indexes (migration 002)');

console.log('  ✅ Migration 002 completed (comments system)');

// ============================================
// Завершение
// ============================================

db.close();

console.log('\n' + '='.repeat(50));
console.log('✅ Database migration completed successfully!');
console.log('='.repeat(50) + '\n');

console.log('📌 Default credentials:');
console.log('   Admin:  admin / admin');
console.log('   Author: author / author');
console.log('\n⚠️  IMPORTANT: Change these passwords after first login!\n');
