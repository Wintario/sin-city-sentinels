import { getDatabase } from '../db/db.js';
import crypto from 'crypto';

const EXPIRES_MS = 24 * 60 * 60 * 1000; // 24h

export function createPendingRegistration({
  username,
  passwordHash,
  characterUrl,
  characterName,
  characterImage = null,
}) {
  const db = getDatabase();
  const token = crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + EXPIRES_MS).toISOString();

  // Удаляем старые/просроченные заявки на тот же username или character_url.
  db.prepare('DELETE FROM pending_character_registrations WHERE expires_at <= CURRENT_TIMESTAMP').run();
  db.prepare('DELETE FROM pending_character_registrations WHERE username = ? OR character_url = ?').run(username, characterUrl);

  const stmt = db.prepare(`
    INSERT INTO pending_character_registrations (
      username, password_hash, character_url, character_name, character_image, token, expires_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(username, passwordHash, characterUrl, characterName, characterImage || null, token, expiresAt);

  return token;
}

export function getPendingRegistrationByToken(token) {
  const db = getDatabase();
  return db.prepare(`
    SELECT *
    FROM pending_character_registrations
    WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
    LIMIT 1
  `).get(token);
}

export function deletePendingRegistrationById(id) {
  const db = getDatabase();
  db.prepare('DELETE FROM pending_character_registrations WHERE id = ?').run(id);
}

export default {
  createPendingRegistration,
  getPendingRegistrationByToken,
  deletePendingRegistrationById,
};

