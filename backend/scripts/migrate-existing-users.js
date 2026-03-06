/**
 * Миграция для существующих пользователей:
 * 1. Копирует username в display_name (для отображения в подписях)
 * 2. Генерирует placeholder email для пользователей без email
 * 3. Помечает всех существующих пользователей как верифицированных
 */

import { getDatabase } from '../src/db/db.js';

const db = getDatabase();

console.log('🚀 Starting migration for existing users...\n');

// 1. Копируем username в display_name для всех пользователей
console.log('📝 Step 1: Copying username to display_name...');
const updateDisplayName = db.prepare(`
  UPDATE users 
  SET display_name = username 
  WHERE display_name IS NULL
`);
const displayNameResult = updateDisplayName.run();
console.log(`   ✅ Updated ${displayNameResult.changes} users\n`);

// 2. Генерируем placeholder email для пользователей без email
console.log('📝 Step 2: Generating placeholder emails...');
const usersWithoutEmail = db.prepare(`
  SELECT id, username FROM users WHERE email IS NULL
`).all();

const generatePlaceholderEmail = (username) => {
  // Генерируем email вида: username@placeholder.wickedrabbits.ru
  const safeUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${safeUsername}@placeholder.wickedrabbits.ru`;
};

const updateEmail = db.prepare(`UPDATE users SET email = ? WHERE id = ?`);
let emailUpdates = 0;

for (const user of usersWithoutEmail) {
  const placeholderEmail = generatePlaceholderEmail(user.username);
  updateEmail.run(placeholderEmail, user.id);
  emailUpdates++;
  console.log(`   📧 ${user.username} → ${placeholderEmail}`);
}

console.log(`   ✅ Updated ${emailUpdates} emails\n`);

// 3. Помечаем всех существующих пользователей как верифицированных
console.log('📝 Step 3: Marking all existing users as verified...');

// Проверяем, есть ли профиль у пользователя
const getProfile = db.prepare(`SELECT id FROM user_profiles WHERE user_id = ?`);
const createProfile = db.prepare(`
  INSERT INTO user_profiles (user_id, arena_nickname, character_url, email_verified)
  VALUES (?, '', '', 1)
`);
const updateProfile = db.prepare(`
  UPDATE user_profiles SET email_verified = 1 WHERE user_id = ?
`);

const allUsers = db.prepare(`SELECT id FROM users`).all();
let verifiedCount = 0;

for (const user of allUsers) {
  const profile = getProfile.get(user.id);
  if (profile) {
    updateProfile.run(user.id);
  } else {
    createProfile.run(user.id);
  }
  verifiedCount++;
}

console.log(`   ✅ Marked ${verifiedCount} users as verified\n`);

console.log('🎉 Migration completed successfully!');
console.log('\n📋 Summary:');
console.log(`   - ${displayNameResult.changes} users got display_name from username`);
console.log(`   - ${emailUpdates} users got placeholder emails`);
console.log(`   - ${verifiedCount} users marked as email verified`);
