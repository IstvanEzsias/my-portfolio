// ============================================================
// MIR — Profile Routes
// GET  /api/profile/:pubkey
// POST /api/profile/upsert
// POST /api/auth/verify
// ============================================================

const express = require('express');
const router = express.Router();
const { users, growthSummaries } = require('../db/queries');

// ── GET /api/profile/:pubkey ─────────────────────────────────
router.get('/:pubkey', (req, res) => {
  try {
    const { pubkey } = req.params;
    if (!pubkey || pubkey.length < 32) {
      return res.status(400).json({ error: 'Invalid pubkey' });
    }

    const user = users.getByPubkey(pubkey);
    const growthSummary = growthSummaries.getLatest(pubkey);

    if (!user) {
      return res.json({ known: false, profile: null, growthSummary: null });
    }

    res.json({
      known: true,
      profile: {
        nostrPubkey:  user.nostr_pubkey,
        nostrNpub:    user.nostr_npub,
        displayName:  user.display_name,
        avatarUrl:    user.avatar_url,
        about:        user.about,
        firstSeen:    user.first_seen,
        lastSeen:     user.last_seen,
        reviewCount:  user.review_count,
      },
      growthSummary: growthSummary ? {
        summary:          growthSummary.summary,
        recurringThemes:  growthSummary.recurring_themes,
        generatedAt:      growthSummary.generated_at,
        sessionsCovered:  growthSummary.sessions_covered,
      } : null,
    });
  } catch (err) {
    console.error('GET /profile error:', err.message);
    res.status(500).json({ error: 'Could not load profile' });
  }
});

// ── POST /api/profile/upsert ─────────────────────────────────
router.post('/upsert', (req, res) => {
  try {
    const { nostrPubkey, nostrNpub, displayName, avatarUrl, about } = req.body;
    if (!nostrPubkey) return res.status(400).json({ error: 'nostrPubkey required' });

    users.upsert({ nostrPubkey, nostrNpub, displayName, avatarUrl, about });
    res.json({ success: true });
  } catch (err) {
    console.error('POST /profile/upsert error:', err.message);
    res.status(500).json({ error: 'Could not save profile' });
  }
});

// ── POST /api/auth/verify ─────────────────────────────────────
// Called on app load to check if this pubkey is a known user
router.post('/verify', (req, res) => {
  try {
    const { nostrPubkey } = req.body;
    if (!nostrPubkey) return res.status(400).json({ error: 'nostrPubkey required' });

    const user = users.getByPubkey(nostrPubkey);
    if (user) {
      users.touchLastSeen(nostrPubkey);
    }

    res.json({
      known: !!user,
      reviewCount: user?.review_count ?? 0,
    });
  } catch (err) {
    console.error('POST /auth/verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
