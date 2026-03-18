// ============================================================
// MIR — Chat Route
// POST /api/chat
// GET  /api/chat/opening
// ============================================================

const express = require('express');
const router = express.Router();
const { callGemini, buildUserContext } = require('../gemini');
const { users, growthSummaries } = require('../db/queries');

// ── GET /api/chat/opening ────────────────────────────────────
// Returns the first AI message to open the evening review
router.get('/opening', async (req, res) => {
  try {
    const { nostrPubkey } = req.query;

    const userContext = await resolveUserContext(nostrPubkey);
    const user = nostrPubkey ? users.getByPubkey(nostrPubkey) : null;
    const name = user?.display_name;
    const count = user?.review_count ?? 0;

    const openingPrompt = name
      ? `Open the evening review for ${name}. This is their ${count > 0 ? `${count + 1}th` : 'first'} review. One or two sentences of genuine presence — not a greeting formula, not cheerful, just arrival.`
      : `Someone is opening MIR for the first time tonight. Welcome them into the space with one or two sentences of genuine presence. No formula, no cheerfulness — just arrival.`;

    const response = await callGemini(
      [{ role: 'user', content: openingPrompt }],
      userContext
    );

    res.json({ message: { role: 'assistant', content: response.content } });

  } catch (error) {
    console.error('Opening message error:', error.message);
    res.json({
      message: {
        role: 'assistant',
        content: "The day is settling.\n\nWhat's sitting with you tonight?"
      }
    });
  }
});

// ── POST /api/chat ────────────────────────────────────────────
// Body: { messages: [{role, content}], nostrPubkey?, sessionId? }
router.post('/', async (req, res) => {
  try {
    const { messages, nostrPubkey } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Each message needs role and content' });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: 'Message role must be user or assistant' });
      }
    }

    const recentMessages = messages.slice(-20);
    const userContext = await resolveUserContext(nostrPubkey);
    const response = await callGemini(recentMessages, userContext);

    res.json({
      message: { role: 'assistant', content: response.content },
      usage: response.usage
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    if (error.message.includes('Gemini API error')) {
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Helper ────────────────────────────────────────────────────
async function resolveUserContext(nostrPubkey) {
  if (!nostrPubkey) return '';
  try {
    const user = users.getByPubkey(nostrPubkey);
    const growthSummary = growthSummaries.getLatest(nostrPubkey);
    return buildUserContext(user, growthSummary);
  } catch {
    return '';
  }
}

module.exports = router;
