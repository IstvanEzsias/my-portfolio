// ============================================================
// Nostr Relay Utilities
// Connects to relays and fetches KIND 0 profile metadata events
// Mirrors the pool.get() pattern from the Lana reference app
// ============================================================

import { SimplePool } from 'nostr-tools/pool';

// ── Default Relay List ────────────────────────────────────────
// Common, reliable Nostr relays. The Lana app fetches its relay
// list from a KIND 38888 event; we start with these defaults.
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine',
  'wss://relay.primal.net',
  'wss://offchain.pub',
];

// ── KIND 0 Profile Metadata ───────────────────────────────────
export interface Kind0Profile {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  about?: string;
  website?: string;
  nip05?: string;
  lud06?: string;
  lud16?: string;
  // Lana-specific fields
  lanaWalletID?: string;
  lanoshi2lash?: string;
  lang?: string;
  language?: string;
  country?: string;
  currency?: string;
  [key: string]: unknown;
}

// ── Fetch KIND 0 Profile ─────────────────────────────────────
// Queries relays for the user's profile event (NIP-01 KIND 0).
// Returns parsed profile content or null if not found.
// Times out after 8 seconds, matching the Lana app's behaviour.
export async function fetchKind0Profile(
  hexPubKey: string,
  relays: string[] = DEFAULT_RELAYS,
  timeoutMs = 8000,
): Promise<Kind0Profile | null> {
  const pool = new SimplePool();

  try {
    const event = await Promise.race([
      pool.get(relays, {
        kinds: [0],
        authors: [hexPubKey],
        limit: 1,
      }),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Relay timeout — no profile found within 8 s')), timeoutMs),
      ),
    ]);

    if (!event) return null;
    return JSON.parse(event.content) as Kind0Profile;
  } finally {
    pool.close(relays);
  }
}

// ── Relay Health Check ────────────────────────────────────────
// Quick probe: can we open a WebSocket to at least one relay?
export function checkRelayConnectivity(
  relays: string[] = DEFAULT_RELAYS,
  timeoutMs = 5000,
): Promise<boolean> {
  return new Promise(resolve => {
    let resolved = false;
    let attempts = 0;

    for (const url of relays) {
      try {
        const ws = new WebSocket(url);
        ws.onopen = () => {
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
          ws.close();
        };
        ws.onerror = () => {
          attempts++;
          if (attempts === relays.length && !resolved) resolve(false);
          try { ws.close(); } catch { /* ignore */ }
        };
      } catch {
        attempts++;
        if (attempts === relays.length && !resolved) resolve(false);
      }
    }

    setTimeout(() => {
      if (!resolved) resolve(false);
    }, timeoutMs);
  });
}
