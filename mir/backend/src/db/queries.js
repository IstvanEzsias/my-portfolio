// ============================================================
// MIR — Database Queries (Nostr-based)
// ============================================================

const { getDb } = require('./schema');

// ── Users ─────────────────────────────────────────────────────
const users = {
  upsert({ nostrPubkey, nostrNpub, displayName, avatarUrl, about }) {
    const db = getDb();
    db.prepare(`
      INSERT INTO users (nostr_pubkey, nostr_npub, display_name, avatar_url, about, last_seen)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(nostr_pubkey) DO UPDATE SET
        nostr_npub   = excluded.nostr_npub,
        display_name = excluded.display_name,
        avatar_url   = excluded.avatar_url,
        about        = excluded.about,
        last_seen    = datetime('now')
    `).run(nostrPubkey, nostrNpub || null, displayName || null, avatarUrl || null, about || null);
  },

  getByPubkey(nostrPubkey) {
    return getDb()
      .prepare('SELECT * FROM users WHERE nostr_pubkey = ?')
      .get(nostrPubkey);
  },

  incrementReviewCount(nostrPubkey) {
    getDb().prepare(`
      UPDATE users
      SET review_count = review_count + 1, last_seen = datetime('now')
      WHERE nostr_pubkey = ?
    `).run(nostrPubkey);
  },

  touchLastSeen(nostrPubkey) {
    getDb().prepare(
      "UPDATE users SET last_seen = datetime('now') WHERE nostr_pubkey = ?"
    ).run(nostrPubkey);
  }
};

// ── Sessions ──────────────────────────────────────────────────
const sessions = {
  create(id, nostrPubkey) {
    getDb().prepare(`
      INSERT INTO sessions (id, nostr_pubkey, started_at)
      VALUES (?, ?, datetime('now'))
    `).run(id, nostrPubkey);
  },

  complete({ id, fullTranscript, closingScript, stageReached, growthSummary }) {
    getDb().prepare(`
      UPDATE sessions
      SET completed_at    = datetime('now'),
          stage_reached   = ?,
          full_transcript = ?,
          closing_script  = ?,
          growth_summary  = ?
      WHERE id = ?
    `).run(stageReached || 'complete', fullTranscript || null, closingScript || null, growthSummary || null, id);
  },

  getById(id) {
    return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  },

  getByPubkey(nostrPubkey, limit = 50) {
    return getDb().prepare(`
      SELECT * FROM sessions
      WHERE nostr_pubkey = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).all(nostrPubkey, limit);
  },

  countCompletedSinceSummary(nostrPubkey, sinceDate) {
    return getDb().prepare(`
      SELECT COUNT(*) as n FROM sessions
      WHERE nostr_pubkey = ? AND completed_at IS NOT NULL AND completed_at > ?
    `).get(nostrPubkey, sinceDate || '1970-01-01').n;
  },

  getRecentTranscripts(nostrPubkey, limit = 10) {
    return getDb().prepare(`
      SELECT id, started_at, closing_script, full_transcript
      FROM sessions
      WHERE nostr_pubkey = ? AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT ?
    `).all(nostrPubkey, limit);
  }
};

// ── Growth Summaries ──────────────────────────────────────────
const growthSummaries = {
  save(nostrPubkey, summary, recurringThemes, sessionsCovered) {
    getDb().prepare(`
      INSERT INTO growth_summaries
        (nostr_pubkey, summary, recurring_themes, sessions_covered, generated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(nostrPubkey, summary, recurringThemes || null, sessionsCovered || 0);
  },

  getLatest(nostrPubkey) {
    return getDb().prepare(`
      SELECT * FROM growth_summaries
      WHERE nostr_pubkey = ?
      ORDER BY generated_at DESC
      LIMIT 1
    `).get(nostrPubkey);
  }
};

module.exports = { users, sessions, growthSummaries };
