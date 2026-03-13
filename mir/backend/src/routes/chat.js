// ============================================================
// MIR — Chat Route
// POST /api/chat
// ============================================================

const express = require('express');
const router = express.Router();
const { callGemini } = require('../gemini');
const { reviews, reviewItems } = require('../db/queries');

// ============================================================
// POST /api/chat
// Body: { messages: [{role, content}], userId?, reviewId? }
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { messages, userId, reviewId } = req.body;

    // Validate
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Each message needs role and content' });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: 'Message role must be user or assistant' });
      }
    }

    // Limit conversation history to last 20 messages (keep context manageable)
    const recentMessages = messages.slice(-20);

    // Build review context if reviewId provided
    let reviewContext = null;
    if (reviewId) {
      try {
        const review = await getReviewContext(reviewId);
        if (review) reviewContext = review;
      } catch (e) {
        // Non-fatal — continue without context
        console.warn('Could not load review context:', e.message);
      }
    }

    // Call Gemini
    const response = await callGemini(recentMessages, reviewContext);

    res.json({
      message: {
        role: 'assistant',
        content: response.content
      },
      usage: response.usage
    });

  } catch (error) {
    console.error('Chat error:', error.message);

    // Don't expose internal errors to client
    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    if (error.message.includes('Gemini API error')) {
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ============================================================
// GET /api/chat/opening
// Returns a context-aware opening message for tonight
// Query: ?userId=X&reviewId=Y
// ============================================================
router.get('/opening', async (req, res) => {
  try {
    const { userId, reviewId } = req.query;

    let reviewContext = null;
    if (reviewId) {
      reviewContext = await getReviewContext(reviewId);
    }

    // Build a prompt asking for an opening message
    const openingPrompt = reviewContext
      ? `This person is beginning their evening. Their mood tonight is ${reviewContext.overall_mood ?? 'unknown'}/10 and their tension level is ${reviewContext.anger_level ?? 'unknown'}/10. Open the conversation with presence — one or two sentences that meet them exactly where they are tonight. No greeting formula.`
      : `Someone is opening MIR for the first time tonight. Welcome them into the space with one or two sentences of genuine presence. No formula, no cheerfulness — just arrival.`;

    const response = await callGemini([
      { role: 'user', content: openingPrompt }
    ], reviewContext);

    res.json({
      message: {
        role: 'assistant',
        content: response.content
      }
    });

  } catch (error) {
    console.error('Opening message error:', error.message);
    // Fallback opening if AI fails
    res.json({
      message: {
        role: 'assistant',
        content: "The day is settling. You're here — that matters.\n\nWhat's sitting with you tonight?"
      }
    });
  }
});

// ============================================================
// Helper: Load review context for AI
// ============================================================
async function getReviewContext(reviewId) {
  const { getDb } = require('../db/schema');
  const db = getDb();

  const review = db.prepare(
    'SELECT * FROM evening_reviews WHERE id = ?'
  ).get(reviewId);

  if (!review) return null;

  const items = db.prepare(
    'SELECT * FROM evening_review_items WHERE evening_review_id = ? ORDER BY created_at'
  ).all(reviewId);

  return {
    overall_mood: review.overall_mood,
    anger_level: review.anger_level,
    completed: review.completed === 1,
    items: items.map(i => ({
      description: i.description,
      type: i.type,
      intensity_before: i.intensity_before,
      intensity_after: i.intensity_after
    }))
  };
}

module.exports = router;
