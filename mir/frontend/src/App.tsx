// ============================================================
// MIR — App Root
// State-based routing: login → home | review | journal | profile
// ============================================================

import { useState, useEffect } from 'react';
import { loadSession, clearSession, type LanaSession } from './lib/session';
import Login    from './pages/Login';
import Home     from './pages/Home';
import Review   from './pages/Review';
import Profile  from './pages/Profile';
import Journal  from './pages/Journal';
import BottomNav, { type Page } from './components/BottomNav';

export default function App() {
  const [session, setSession] = useState<LanaSession | null>(() => loadSession());
  const [page, setPage]       = useState<Page>('home');

  // Sync active page on session change
  useEffect(() => {
    if (session) setPage('home');
  }, [!!session]);

  function handleLogin(s: LanaSession) {
    setSession(s);
    setPage('home');
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  function handleBeginReview() {
    setPage('review');
  }

  function handleReviewComplete() {
    setPage('home');
  }

  // ── Not logged in ───────────────────────────────────────────
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  // ── Review is its own full-screen experience ────────────────
  if (page === 'review') {
    return (
      <Review
        session={session}
        onComplete={handleReviewComplete}
      />
    );
  }

  // ── Tabbed screens ──────────────────────────────────────────
  return (
    <div style={{ background: '#080810', minHeight: '100dvh' }}>
      {page === 'home' && (
        <Home
          session={session}
          onBeginReview={handleBeginReview}
        />
      )}
      {page === 'journal' && (
        <Journal session={session} />
      )}
      {page === 'profile' && (
        <Profile session={session} onLogout={handleLogout} />
      )}

      <BottomNav current={page} onChange={setPage} />
    </div>
  );
}
