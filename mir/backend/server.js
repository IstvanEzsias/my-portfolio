// ============================================================
// MIR — Backend Server
// Node.js + Express + SQLite + Gemini Flash 2.0
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { seedDevData } = require('./src/db/schema');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50kb' }));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/chat', require('./src/routes/chat'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MIR',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    gemini: !!process.env.GEMINI_API_KEY ? 'configured' : 'missing'
  });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('✨ MIR backend running on port ' + PORT);
  console.log('   Gemini: ' + (process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing GEMINI_API_KEY'));
  if (process.env.NODE_ENV === 'development') seedDevData();
});
