// ============================================================
// MIR — Database Schema (Nostr-based)
// SQLite via better-sqlite3
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/mir.db');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

// ── Schema ────────────────────────────────────────────────────
function initSchema() {
  db.exec(`
    -- Users identified by Nostr public key
    CREATE TABLE IF NOT EXISTS users (
      nostr_pubkey   TEXT PRIMARY KEY,
      nostr_npub     TEXT,
      display_name   TEXT,
      avatar_url     TEXT,
      about          TEXT,
      first_seen     TEXT DEFAULT (datetime('now')),
      last_seen      TEXT DEFAULT (datetime('now')),
      review_count   INTEGER DEFAULT 0
    );

    -- Evening review sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id               TEXT PRIMARY KEY,
      nostr_pubkey     TEXT NOT NULL REFERENCES users(nostr_pubkey),
      started_at       TEXT DEFAULT (datetime('now')),
      completed_at     TEXT,
      stage_reached    TEXT DEFAULT 'arrive',
      full_transcript  TEXT,
      growth_summary   TEXT,
      closing_script   TEXT
    );

    -- Growth summaries generated from batches of sessions
    CREATE TABLE IF NOT EXISTS growth_summaries (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      nostr_pubkey       TEXT NOT NULL REFERENCES users(nostr_pubkey),
      generated_at       TEXT DEFAULT (datetime('now')),
      summary            TEXT,
      recurring_themes   TEXT,
      sessions_covered   INTEGER DEFAULT 0
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_sessions_pubkey   ON sessions(nostr_pubkey);
    CREATE INDEX IF NOT EXISTS idx_growth_pubkey     ON growth_summaries(nostr_pubkey);
  `);
  console.log('✅ Database schema initialised');
}

module.exports = { getDb };
