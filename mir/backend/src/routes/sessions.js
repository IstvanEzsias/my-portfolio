// ============================================================
// MIR — Session Routes
// POST /api/sessions/start
// POST /api/sessions/complete
// GET  /api/sessions/:pubkey
// ============================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sessions, users, growthSummaries } = require('../db/queries');
const { generateGrowthSummary } = require('../gemini');

// ── POST /api/sessions/start ──────────────────────────────────
router.post('/start', (req, res) => {
  try {
    const { nostrPubkey } = req.body;
    if (!nostrPubkey) return res.status(400).json({ error: 'nostrPubkey required' });

    // Ensure user record exists (upsert with minimal data)
    const existing = users.getByPubkey(nostrPubkey);
    if (!existing) {
      users.upsert({ nostrPubkey });
    }

    const sessionId = crypto.randomUUID();
    sessions.create(sessionId, nostrPubkey);

    res.json({ sessionId });
  } catch (err) {
    console.error('POST /sessions/start error:', err.message);
    res.status(500).json({ error: 'Could not start session' });
  }
});

// ── POST /api/sessions/complete ───────────────────────────────
router.post('/complete', async (req, res) => {
  try {
    const { sessionId, nostrPubkey, fullTranscript, closingScript, stageReached } = req.body;
    if (!sessionId || !nostrPubkey) {
      return res.status(400).json({ error: 'sessionId and nostrPubkey required' });
    }

    sessions.complete({
      id: sessionId,
      fullTranscript: typeof fullTranscript === 'object'
        ? JSON.stringify(fullTranscript)
        : fullTranscript,
      closingScript,
      stageReached,
    });

    users.incrementReviewCount(nostrPubkey);

    // ── Check if we should generate a growth summary ──────────
    let newGrowthSummary = null;
    try {
      const latestSummary = growthSummaries.getLatest(nostrPubkey);
      const sinceDate = latestSummary?.generated_at || '1970-01-01';
      const newCount = sessions.countCompletedSinceSummary(nostrPubkey, sinceDate);

      if (newCount >= 3) {
        const user = users.getByPubkey(nostrPubkey);
        const recentTranscripts = sessions.getRecentTranscripts(nostrPubkey, 10);
        const result = await generateGrowthSummary(user?.display_name, recentTranscripts);

        if (result) {
          growthSummaries.save(
            nostrPubkey,
            result.summary,
            result.themes,
            recentTranscripts.length
          );
          newGrowthSummary = result.summary;
        }
      }
    } catch (e) {
      // Non-fatal — don't fail the whole complete call
      console.warn('Growth summary generation error:', e.message);
    }

    res.json({ success: true, growthSummary: newGrowthSummary });
  } catch (err) {
    console.error('POST /sessions/complete error:', err.message);
    res.status(500).json({ error: 'Could not complete session' });
  }
});

// ── GET /api/sessions/:pubkey ─────────────────────────────────
router.get('/:pubkey', (req, res) => {
  try {
    const { pubkey } = req.params;
    if (!pubkey) return res.status(400).json({ error: 'pubkey required' });

    const list = sessions.getByPubkey(pubkey, 50);

    res.json({
      sessions: list.map(s => ({
        id:            s.id,
        startedAt:     s.started_at,
        completedAt:   s.completed_at,
        stageReached:  s.stage_reached,
        closingScript: s.closing_script,
        // Don't return full_transcript in the list — only on expand
      }))
    });
  } catch (err) {
    console.error('GET /sessions/:pubkey error:', err.message);
    res.status(500).json({ error: 'Could not load sessions' });
  }
});

// ── GET /api/sessions/detail/:id ─────────────────────────────
// Full transcript for a specific session (journal expand)
router.get('/detail/:id', (req, res) => {
  try {
    const session = sessions.getById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let transcript = null;
    if (session.full_transcript) {
      try { transcript = JSON.parse(session.full_transcript); } catch { /* raw string */ }
    }

    res.json({
      id:            session.id,
      startedAt:     session.started_at,
      completedAt:   session.completed_at,
      stageReached:  session.stage_reached,
      closingScript: session.closing_script,
      transcript,
    });
  } catch (err) {
    console.error('GET /sessions/detail/:id error:', err.message);
    res.status(500).json({ error: 'Could not load session' });
  }
});

module.exports = router;
