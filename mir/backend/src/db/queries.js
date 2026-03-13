// ============================================================
// MIR — Database Queries
// ============================================================

const { getDb } = require('./schema');

// ── Reviews ──────────────────────────────────────────────────
const reviews = {
  create(userId, overallMood, angerLevel) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO evening_reviews (user_id, overall_mood, anger_level)
      VALUES (?, ?, ?)
    `).run(userId || null, overallMood ?? null, angerLevel ?? null);
    return result.lastInsertRowid;
  },

  getById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM evening_reviews WHERE id = ?').get(id);
  },

  update(id, fields) {
    const db = getDb();
    const allowed = ['overall_mood', 'anger_level', 'completed'];
    const updates = Object.keys(fields)
      .filter(k => allowed.includes(k))
      .map(k => `${k} = ?`)
      .join(', ');
    if (!updates) return;
    const values = Object.keys(fields)
      .filter(k => allowed.includes(k))
      .map(k => fields[k]);
    db.prepare(`
      UPDATE evening_reviews
      SET ${updates}, updated_at = datetime('now')
      WHERE id = ?
    `).run(...values, id);
  },

  complete(id) {
    const db = getDb();
    db.prepare(`
      UPDATE evening_reviews
      SET completed = 1, updated_at = datetime('now')
      WHERE id = ?
    `).run(id);
  }
};

// ── Review Items ─────────────────────────────────────────────
const reviewItems = {
  add(reviewId, description, type = 'situation', intensityBefore = null) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO evening_review_items
        (evening_review_id, description, type, intensity_before)
      VALUES (?, ?, ?, ?)
    `).run(reviewId, description, type, intensityBefore);
    return result.lastInsertRowid;
  },

  setIntensityAfter(itemId, intensityAfter) {
    const db = getDb();
    db.prepare(`
      UPDATE evening_review_items
      SET intensity_after = ?
      WHERE id = ?
    `).run(intensityAfter, itemId);
  },

  getByReview(reviewId) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM evening_review_items
      WHERE evening_review_id = ?
      ORDER BY created_at
    `).all(reviewId);
  }
};

// ── Chat Messages ────────────────────────────────────────────
const chatMessages = {
  save(userId, reviewId, role, content) {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO chat_messages (user_id, review_id, role, content)
      VALUES (?, ?, ?, ?)
    `).run(userId || null, reviewId || null, role, content);
    return result.lastInsertRowid;
  },

  getByReview(reviewId, limit = 50) {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM chat_messages
      WHERE review_id = ?
      ORDER BY created_at
      LIMIT ?
    `).all(reviewId, limit);
  }
};

module.exports = { reviews, reviewItems, chatMessages };
