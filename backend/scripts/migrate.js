import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { mkdirSync, existsSync } from 'fs';
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

// Таблица news
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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  )
`);
console.log('  ✅ Table "news" created');

// Таблица members
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    profile_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    order_index INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('  ✅ Table "members" created');

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
db.exec(`CREATE INDEX IF NOT EXISTS idx_members_status ON members(status)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_members_order ON members(order_index)`);
console.log('  ✅ Indexes created');

// ============================================
// Создание дефолтных пользователей
// ============================================

console.log('\n👤 Creating default users...\n');

const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)
`);

// Дефолтные пользователи
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
    INSERT INTO members (name, role, profile_url, status, order_index) VALUES (?, ?, ?, ?, ?)
  `);
  
  const initialMembers = [
    { name: 'легион86', role: 'Глава клана', profile_url: 'https://kovcheg2.apeha.ru/info.html?user=201617408', status: 'active', order_index: 1 },
    { name: 'Рейдер', role: 'Офицер', profile_url: null, status: 'active', order_index: 2 },
    { name: 'Тень', role: 'Ветеран', profile_url: null, status: 'active', order_index: 3 },
    { name: 'Клык', role: 'Боец', profile_url: null, status: 'active', order_index: 4 },
    { name: 'Шторм', role: 'Боец', profile_url: null, status: 'active', order_index: 5 },
  ];
  
  for (const member of initialMembers) {
    insertMember.run(member.name, member.role, member.profile_url, member.status, member.order_index);
    console.log(`  ✅ Member "${member.name}" created (${member.role})`);
  }
} else {
  console.log(`  ⏭️  Members table already has ${membersCount.count} entries`);
}

// ============================================
// Создание начальных новостей
// ============================================

console.log('\n📰 Creating initial news...\n');

const checkNews = db.prepare('SELECT COUNT(*) as count FROM news');
const newsCount = checkNews.get();

if (newsCount.count === 0) {
  const insertNews = db.prepare(`
    INSERT INTO news (title, slug, content, excerpt, author_id, published_at) 
    VALUES (?, ?, ?, ?, ?, ?)
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
      published_at: new Date(Date.now() - 86400000).toISOString() // вчера
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
      published_at: new Date(Date.now() - 172800000).toISOString() // позавчера
    }
  ];
  
  // Получаем ID админа
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  for (const news of initialNews) {
    insertNews.run(news.title, news.slug, news.content, news.excerpt, admin.id, news.published_at);
    console.log(`  ✅ News "${news.title.substring(0, 40)}..." created`);
  }
} else {
  console.log(`  ⏭️  News table already has ${newsCount.count} entries`);
}

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
