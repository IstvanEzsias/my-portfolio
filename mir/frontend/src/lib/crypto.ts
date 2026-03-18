// ============================================================
// Lana Crypto Utilities
// WIF / nsec / hex private key → Nostr IDs
// ============================================================

import { getPublicKey } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

// ── Helpers ───────────────────────────────────────────────────
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string length');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ── Base58 ────────────────────────────────────────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Decode(str: string): Uint8Array {
  const bytes = [0];
  for (const char of str) {
    const digit = BASE58_ALPHABET.indexOf(char);
    if (digit < 0) throw new Error(`Invalid base58 character: ${char}`);
    let carry = digit;
    for (let j = bytes.length - 1; j >= 0; j--) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.unshift(carry & 0xff);
      carry >>= 8;
    }
  }
  // Preserve leading zeros
  for (const char of str) {
    if (char === '1') bytes.unshift(0);
    else break;
  }
  return new Uint8Array(bytes);
}

// ── SHA-256 via Web Crypto ────────────────────────────────────
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  return new Uint8Array(hash);
}

// ── WIF Decoder ───────────────────────────────────────────────
export async function decodeWif(wif: string): Promise<Uint8Array> {
  const decoded = base58Decode(wif);
  if (decoded.length < 37) throw new Error('WIF key is too short');

  const payload  = decoded.slice(0, decoded.length - 4);
  const checksum = decoded.slice(decoded.length - 4);

  const hash1 = await sha256(payload);
  const hash2 = await sha256(hash1);
  for (let i = 0; i < 4; i++) {
    if (hash2[i] !== checksum[i]) throw new Error('Invalid WIF checksum — is this the correct key?');
  }

  let privKeyBytes = payload.slice(1); // remove version byte
  if (privKeyBytes.length === 33 && privKeyBytes[32] === 0x01) {
    privKeyBytes = privKeyBytes.slice(0, 32); // strip compressed flag
  }
  if (privKeyBytes.length !== 32) {
    throw new Error(`Unexpected WIF key length: ${privKeyBytes.length} bytes`);
  }
  return privKeyBytes;
}

// ── Key Detection ─────────────────────────────────────────────
export function detectKeyFormat(input: string): 'nsec' | 'wif' | 'hex' | 'unknown' {
  const t = input.trim();
  if (t.startsWith('nsec1'))                                   return 'nsec';
  if (t.length === 64 && /^[0-9a-fA-F]+$/.test(t))            return 'hex';
  if (t.length >= 51 && t.length <= 58)                        return 'wif';
  return 'unknown';
}

// ── Main: Any Key Format → Nostr IDs ─────────────────────────
export interface NostrIds {
  hexPrivKey: string;
  hexPubKey:  string;
  npub:       string;
  nsec:       string;
}

export async function convertKeyToNostrIds(input: string): Promise<NostrIds> {
  const trimmed = input.trim();
  const format  = detectKeyFormat(trimmed);
  let hexPrivKey: string;

  // ── Decode to hex private key ─────────────────────────────
  if (format === 'nsec') {
    // nostr-tools v2: nip19.decode('nsec1...').data is Uint8Array
    // nostr-tools v1: .data was a hex string
    // Handle both so we're version-agnostic.
    let decoded: ReturnType<typeof nip19.decode>;
    try {
      decoded = nip19.decode(trimmed);
    } catch {
      throw new Error('Invalid nsec key — could not decode bech32. Check for typos or extra spaces.');
    }
    if (decoded.type !== 'nsec') {
      throw new Error(`Key decoded as "${decoded.type}", not nsec. Make sure you are entering your private key (nsec1…), not a public key.`);
    }
    const raw = decoded.data;
    // Normalise to hex regardless of library version
    hexPrivKey = typeof raw === 'string'
      ? raw
      : bytesToHex(raw as Uint8Array);

  } else if (format === 'hex') {
    hexPrivKey = trimmed.toLowerCase();

  } else if (format === 'wif') {
    const privBytes = await decodeWif(trimmed);
    hexPrivKey = bytesToHex(privBytes);

  } else {
    throw new Error('Unrecognised key format. Please enter an nsec1 Nostr key, WIF, or 64-character hex private key.');
  }

  // ── Validate length ───────────────────────────────────────
  if (hexPrivKey.length !== 64) {
    throw new Error(`Decoded key has wrong length (${hexPrivKey.length} hex chars, expected 64). The key may be corrupted.`);
  }

  // ── Derive public key & encode ────────────────────────────
  // Always pass Uint8Array to getPublicKey (nostr-tools v2 standard)
  const privKeyBytes = hexToBytes(hexPrivKey);
  const hexPubKey    = getPublicKey(privKeyBytes);
  const npub         = nip19.npubEncode(hexPubKey);
  const nsec         = nip19.nsecEncode(privKeyBytes);

  return { hexPrivKey, hexPubKey, npub, nsec };
}
