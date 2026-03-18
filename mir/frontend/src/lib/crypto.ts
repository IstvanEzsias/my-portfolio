// ============================================================
// Lana Crypto Utilities
// WIF (Wallet Import Format) → Nostr key derivation
// Mirrors the convertWifToIds() logic from the Lana reference app
// ============================================================

import { getPublicKey } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

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
  // Preserve leading zeros for leading '1's
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

// ── Helpers ───────────────────────────────────────────────────
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ── WIF Decoder ───────────────────────────────────────────────
// Supports LanaCoin WIF (version byte 0xB0) and Bitcoin WIF (0x80)
export async function decodeWif(wif: string): Promise<Uint8Array> {
  const decoded = base58Decode(wif);

  if (decoded.length < 37) throw new Error('WIF key is too short');

  const payload = decoded.slice(0, decoded.length - 4);
  const checksum = decoded.slice(decoded.length - 4);

  // Verify checksum
  const hash1 = await sha256(payload);
  const hash2 = await sha256(hash1);
  for (let i = 0; i < 4; i++) {
    if (hash2[i] !== checksum[i]) throw new Error('Invalid WIF checksum — is this the correct key?');
  }

  // Remove version byte (0xB0 for LanaCoin, 0x80 for Bitcoin)
  let privKeyBytes = payload.slice(1);

  // Remove compressed flag (0x01 at end = compressed pubkey)
  if (privKeyBytes.length === 33 && privKeyBytes[32] === 0x01) {
    privKeyBytes = privKeyBytes.slice(0, 32);
  }

  if (privKeyBytes.length !== 32) {
    throw new Error(`Unexpected private key length: ${privKeyBytes.length}`);
  }

  return privKeyBytes;
}

// ── nsec Decoder ──────────────────────────────────────────────
export function decodeNsec(nsec: string): Uint8Array {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') throw new Error('Not a valid nsec key');
  return decoded.data as Uint8Array;
}

// ── Key Detection ─────────────────────────────────────────────
export function detectKeyFormat(input: string): 'nsec' | 'wif' | 'hex' | 'unknown' {
  const trimmed = input.trim();
  if (trimmed.startsWith('nsec1')) return 'nsec';
  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) return 'hex';
  // WIF keys: ~51-52 chars for uncompressed, typically start with 5, K, or L (Bitcoin)
  // LanaCoin WIF starts with different chars due to version byte 0xB0
  if (trimmed.length >= 51 && trimmed.length <= 58) return 'wif';
  return 'unknown';
}

// ── Main: Any Key Format → Nostr IDs ─────────────────────────
export interface NostrIds {
  hexPrivKey: string;
  hexPubKey: string;
  npub: string;
  nsec: string;
}

export async function convertKeyToNostrIds(input: string): Promise<NostrIds> {
  const format = detectKeyFormat(input.trim());
  let privKeyBytes: Uint8Array;

  if (format === 'nsec') {
    privKeyBytes = decodeNsec(input.trim());
  } else if (format === 'hex') {
    privKeyBytes = hexToBytes(input.trim().toLowerCase());
  } else if (format === 'wif') {
    privKeyBytes = await decodeWif(input.trim());
  } else {
    throw new Error('Unrecognised key format. Please enter a WIF, nsec, or hex private key.');
  }

  const hexPrivKey = bytesToHex(privKeyBytes);
  const hexPubKey = getPublicKey(privKeyBytes);
  const npub = nip19.npubEncode(hexPubKey);
  const nsec = nip19.nsecEncode(privKeyBytes);

  return { hexPrivKey, hexPubKey, npub, nsec };
}
