// ============================================================
// MIR — Session Management
// Nostr-based auth session persisted to storage
// ============================================================

import type { Kind0Profile } from './nostr';

export interface LanaSession {
  hexPubKey:  string;
  npub:       string;
  hexPrivKey: string;
  nsec:       string;
  profile:    Kind0Profile | null;
  expiresAt:  number;
  rememberMe: boolean;
}

const SESSION_KEY = 'lana_session';

export function loadSession(): LanaSession | null {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ??
      sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: LanaSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: LanaSession) {
  const raw = JSON.stringify(session);
  if (session.rememberMe) {
    localStorage.setItem(SESSION_KEY, raw);
  } else {
    sessionStorage.setItem(SESSION_KEY, raw);
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
