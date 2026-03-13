// ============================================================
// MIR — Database Schema
// SQLite via better-sqlite3
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/mir.db');

let db;

function getDb() {
  if (!db) {
    // Ensure data directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

// ── Schema ───────────────────────────────────────────────────
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evening_reviews (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER REFERENCES users(id),
      overall_mood  INTEGER CHECK(overall_mood BETWEEN 0 AND 10),
      anger_level   INTEGER CHECK(anger_level BETWEEN 0 AND 10),
      completed     INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evening_review_items (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      evening_review_id   INTEGER NOT NULL REFERENCES evening_reviews(id) ON DELETE CASCADE,
      description         TEXT NOT NULL,
      type                TEXT DEFAULT 'situation',
      intensity_before    INTEGER CHECK(intensity_before BETWEEN 0 AND 10),
      intensity_after     INTEGER CHECK(intensity_after BETWEEN 0 AND 10),
      created_at          TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id),
      review_id   INTEGER REFERENCES evening_reviews(id),
      role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content     TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Database schema initialised');
}

// ── Dev seed ─────────────────────────────────────────────────
function seedDevData() {
  const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  if (userCount > 0) return; // already seeded

  const insertUser = db.prepare("INSERT INTO users (name) VALUES (?)");
  const user = insertUser.run('Dev User');

  const insertReview = db.prepare(`
    INSERT INTO evening_reviews (user_id, overall_mood, anger_level, completed)
    VALUES (?, ?, ?, ?)
  `);
  const review = insertReview.run(user.lastInsertRowid, 6, 4, 0);

  const insertItem = db.prepare(`
    INSERT INTO evening_review_items (evening_review_id, description, type, intensity_before)
    VALUES (?, ?, ?, ?)
  `);
  insertItem.run(review.lastInsertRowid, 'Difficult meeting at work', 'situation', 7);
  insertItem.run(review.lastInsertRowid, 'Argument with a friend', 'relationship', 8);

  console.log('🌱 Dev seed data inserted');
}

module.exports = { getDb, seedDevData };
