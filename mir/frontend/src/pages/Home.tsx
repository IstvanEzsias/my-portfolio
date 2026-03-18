// ============================================================
// MIR — Home Screen
// Hero logo (includes MIR + MAGIC IS REAL text), daily quote,
// streak counter, Begin Tonight's Review button
// ============================================================

import { useState, useEffect } from 'react';
import type { LanaSession } from '../lib/session';
import { getDailyQuote } from '../lib/quotes';
import { MirLogo } from '../components/MIRLogo';

const API_URL = import.meta.env.VITE_API_URL || '';

interface HomeProps {
  session:        LanaSession;
  onBeginReview:  () => void;
}

export default function Home({ session, onBeginReview }: HomeProps) {
  const [reviewCount, setReviewCount] = useState(0);
  const [streak, setStreak]           = useState(0);
  const quote = getDailyQuote();

  const profile     = session.profile;
  const displayName = profile?.display_name ?? profile?.name ?? null;

  useEffect(() => {
    fetch(`${API_URL}/api/profile/${session.hexPubKey}`)
      .then(r => r.json())
      .then(data => {
        if (data.profile?.reviewCount !== undefined) setReviewCount(data.profile.reviewCount);
      })
      .catch(() => {});

    // Compute streak from session history
    fetch(`${API_URL}/api/sessions/${session.hexPubKey}`)
      .then(r => r.json())
      .then(data => setStreak(computeStreak(data.sessions ?? [])))
      .catch(() => {});
  }, [session.hexPubKey]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: '#080810',
      color: '#e8e4d9',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px 88px',
      fontFamily: 'sans-serif',
    }}>

      {/* Hero logo — includes MIR + MAGIC IS REAL text */}
      <MirLogo size={200} />

      {/* Sacred subtitle */}
      <p style={{
        marginTop: '8px',
        fontSize: '13px',
        color: '#5a5650',
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        textAlign: 'center',
        letterSpacing: '0.03em',
      }}>
        A sacred space for the evening review.
      </p>

      {/* Daily quote */}
      <div style={{
        marginTop: '28px',
        padding: '18px 22px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        maxWidth: '340px',
        width: '100%',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '14px',
          color: '#b8b4a9',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          lineHeight: 1.65,
          margin: 0,
        }}>
          "{quote.text}"
        </p>
        <p style={{
          marginTop: '10px',
          fontSize: '11px',
          color: '#5a5650',
          letterSpacing: '0.06em',
        }}>
          — {quote.source}
        </p>
      </div>

      {/* Begin button */}
      <button
        onClick={onBeginReview}
        style={{
          marginTop: '30px',
          padding: '16px 44px',
          background: '#c8a96e',
          color: '#080810',
          border: 'none',
          borderRadius: '14px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '0.04em',
          boxShadow: '0 0 28px rgba(200,169,110,0.2)',
          transition: 'box-shadow 0.2s, transform 0.12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 0 38px rgba(200,169,110,0.38)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 0 28px rgba(200,169,110,0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Begin Tonight's Review
      </button>

      {/* Streak + count — quiet, not gamified */}
      <div style={{
        marginTop: '22px',
        display: 'flex',
        gap: '28px',
        alignItems: 'center',
      }}>
        {streak >= 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#c8a96e', fontFamily: 'Georgia, serif' }}>
              {streak}
            </div>
            <div style={{ fontSize: '11px', color: '#5a5650', letterSpacing: '0.04em' }}>
              {streak === 1 ? 'night' : 'nights'}
            </div>
          </div>
        )}
        {reviewCount > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#8a8478', fontFamily: 'Georgia, serif' }}>
              {reviewCount}
            </div>
            <div style={{ fontSize: '11px', color: '#5a5650', letterSpacing: '0.04em' }}>
              {reviewCount === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        )}
      </div>

      {/* Display name only — no npub */}
      {displayName && (
        <div style={{ marginTop: '20px', fontSize: '13px', color: '#6a6460', textAlign: 'center' }}>
          {displayName}
        </div>
      )}
    </div>
  );
}

// ── Streak calculator ─────────────────────────────────────────
function computeStreak(sessions: Array<{ completedAt: string | null }>) {
  const days = sessions
    .filter(s => s.completedAt)
    .map(s => new Date(s.completedAt!).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // unique days
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (days.length === 0) return 0;

  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Streak must include today or yesterday to be active
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime();
    const curr = new Date(days[i]).getTime();
    if (prev - curr === 86400000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
