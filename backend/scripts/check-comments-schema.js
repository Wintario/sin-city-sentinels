import { getDatabase } from '../src/db/db.js';

const db = getDatabase();

console.log('=== Таблица comments ===');
const columns = db.prepare("PRAGMA table_info(comments)").all();
console.log('Колонки:');
columns.forEach(col => {
  console.log(`  ${col.name} (${col.type}), notnull: ${col.notnull}, default: ${col.dflt_value}, pk: ${col.pk}`);
});

console.log('\n=== Индексы ===');
const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='comments'").all();
indexes.forEach(idx => {
  console.log(`  ${idx.name}: ${idx.sql}`);
});

console.log('\n✅ Проверка завершена');
// Не вызываем process.exit(), чтобы не завершать процесс преждевременно
// при импорте этого модуля
