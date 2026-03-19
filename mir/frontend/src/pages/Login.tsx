// ============================================================
// MIR — Login Page
// Nostr nsec / WIF / hex private key authentication
// Supports manual entry + QR code scan (html5-qrcode)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { convertKeyToNostrIds, detectKeyFormat } from '../lib/crypto';
import { fetchKind0Profile, checkRelayConnectivity, DEFAULT_RELAYS } from '../lib/nostr';
import { saveSession, type LanaSession } from '../lib/session';
import { MirLogo } from '../components/MIRLogo';

const API_URL = import.meta.env.VITE_API_URL || '';

type LoginStatus =
  | { state: 'idle' }
  | { state: 'connecting' }
  | { state: 'fetching' }
  | { state: 'saving' }
  | { state: 'success'; name: string }
  | { state: 'error'; message: string };

interface LoginProps {
  onLogin: (session: LanaSession) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [showKey, setShowKey]       = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus]         = useState<LoginStatus>({ state: 'idle' });
  const [relayOk, setRelayOk]       = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Keep a ref to onLogin so doLogin always calls the latest version
  // regardless of React closure/stale-prop issues (critical for QR flow)
  const onLoginRef = useRef(onLogin);
  useEffect(() => { onLoginRef.current = onLogin; }, [onLogin]);

  useEffect(() => {
    checkRelayConnectivity().then(ok => setRelayOk(ok));
  }, []);

  // ── Core login logic (shared by manual + QR) ──────────────
  async function doLogin(key: string) {
    const trimmed = key.trim();
    if (!trimmed) return;

    setStatus({ state: 'connecting' });

    try {
      const ids = await convertKeyToNostrIds(trimmed);

      setStatus({ state: 'fetching' });
      let profile = null;
      try {
        profile = await fetchKind0Profile(ids.hexPubKey, DEFAULT_RELAYS, 8000);
      } catch { /* no profile on relays — still allow login */ }

      setStatus({ state: 'saving' });
      if (profile) {
        try {
          await fetch(`${API_URL}/api/profile/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nostrPubkey: ids.hexPubKey,
              nostrNpub:   ids.npub,
              displayName: profile.display_name ?? profile.name ?? null,
              avatarUrl:   profile.picture ?? null,
              about:       profile.about ?? null,
            }),
          });
        } catch { /* non-fatal */ }
      }

      const durationMs = rememberMe
        ? 90 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

      const session: LanaSession = {
        hexPubKey:  ids.hexPubKey,
        npub:       ids.npub,
        hexPrivKey: ids.hexPrivKey,
        nsec:       ids.nsec,
        profile,
        expiresAt:  Date.now() + durationMs,
        rememberMe,
      };

      saveSession(session);
      const displayName = profile?.display_name ?? profile?.name ?? '';
      setStatus({ state: 'success', name: displayName || 'Welcome' });
      // Use ref to guarantee we call the current onLogin, never a stale closure.
      // The 900 ms delay lets the ✦ success flash play before navigating.
      setTimeout(() => onLoginRef.current(session), 900);

    } catch (err) {
      setStatus({ state: 'error', message: (err as Error).message ?? 'Unexpected error' });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(privateKey);
  }

  // ── QR scan callback ───────────────────────────────────────
  function handleQRScan(scanned: string) {
    const trimmed = scanned.trim();
    if (detectKeyFormat(trimmed) === 'unknown') {
      setStatus({ state: 'error', message: 'QR code did not contain a valid WIF key' });
      return;
    }
    setShowScanner(false);
    setPrivateKey(trimmed);
    doLogin(trimmed);
  }

  const busy = ['connecting', 'fetching', 'saving'].includes(status.state);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: 'var(--bg)',
      color: 'var(--text)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'sans-serif',
    }}>

      <div style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Hero logo */}
        <MirLogo size={180} />

        {/* Prompt */}
        <p style={{
          marginTop: '20px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.5,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}>
          Enter your Lana WIF key to begin.
        </p>

        {/* Relay status */}
        <RelayBadge ok={relayOk} />

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{ width: '100%', marginTop: '22px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Input row — key field + eye toggle + camera button */}
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={privateKey}
              onChange={e => setPrivateKey(e.target.value)}
              placeholder="WIF private key"
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--input-bg)',
                border: `1px solid ${status.state === 'error' ? 'rgba(220,80,80,0.5)' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '14px 80px 14px 16px',
                color: 'var(--text)',
                fontFamily: 'monospace',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e  => (e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--gold) 50%, transparent)')}
              onBlur={e   => (e.currentTarget.style.borderColor =
                status.state === 'error' ? 'rgba(220,80,80,0.5)' : 'var(--border)')}
            />
            {/* Eye toggle */}
            <button
              type="button" onClick={() => setShowKey(v => !v)} tabIndex={-1}
              title={showKey ? 'Hide key' : 'Show key'}
              style={{
                position: 'absolute', right: '13px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', padding: '4px', display: 'flex',
              }}
            >
              {showKey ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            {/* Camera / QR scan button */}
            <button
              type="button"
              onClick={() => { setShowScanner(v => !v); setStatus({ state: 'idle' }); }}
              tabIndex={-1}
              title="Scan QR code"
              disabled={busy}
              style={{
                position: 'absolute', right: '45px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: busy ? 'default' : 'pointer',
                color: showScanner ? 'var(--gold)' : 'var(--text-secondary)',
                padding: '4px', display: 'flex',
                transition: 'color 0.2s',
              }}
            >
              <QRIcon />
            </button>
          </div>

          {/* Inline QR scanner — appears below input when active */}
          {showScanner && (
            <QRScanner
              onScan={handleQRScan}
              onClose={() => setShowScanner(false)}
            />
          )}

          {/* Step status */}
          <div style={{
            marginTop: '10px',
            minHeight: '18px',
            fontSize: '13px',
            color: statusColor(status.state),
            textAlign: 'center',
          }}>
            <StatusLine status={status} />
          </div>

          {/* Remember me */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginTop: '14px', cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox" checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--gold)', width: '15px', height: '15px' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Remember me for 90 days</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!privateKey.trim() || busy}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '15px',
              background: privateKey.trim() && !busy ? 'var(--gold)' : 'var(--border)',
              color:      privateKey.trim() && !busy ? 'var(--bg)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: privateKey.trim() && !busy ? 'pointer' : 'default',
              transition: 'background 0.2s, color 0.2s',
              letterSpacing: '0.02em',
            }}
          >
            {busy ? <BusyLabel state={status.state} /> : 'Begin'}
          </button>
        </form>

        {/* Privacy note */}
        <p style={{
          marginTop: '16px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          The private key never leaves this device.
        </p>

        {/* Success preview */}
        {status.state === 'success' && <SuccessPreview name={status.name} />}
      </div>
    </div>
  );
}

// ── Inline QR Scanner ─────────────────────────────────────────
const QR_SCANNER_ID = 'mir-qr-scanner';

function QRScanner({ onScan, onClose }: { onScan: (v: string) => void; onClose: () => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stopped = false;

    const scanner = new Html5Qrcode(QR_SCANNER_ID);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decoded) => {
        if (stopped) return;
        stopped = true;
        // Notify parent immediately — don't block on scanner.stop() resolving.
        // Waiting in .finally() caused the React state update to be swallowed
        // in some browsers because the component unmounted mid-chain.
        onScan(decoded);
        scanner.stop().catch(() => {});
      },
      () => { /* per-frame decode failure — normal, ignore */ }
    )
    .then(() => setScanning(true))
    .catch(() => {
      setCamError('Camera access denied. Please allow camera access or paste your key manually.');
    });

    return () => {
      stopped = true;
      scanner.stop().catch(() => {});
    };
  }, []);

  function handleCancel() {
    scannerRef.current?.stop().catch(() => {});
    onClose();
  }

  return (
    <div style={{
      marginTop: '12px',
      borderRadius: '14px',
      overflow: 'hidden',
      border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)',
      background: 'var(--card-bg)',
    }}>
      {/* Camera viewport */}
      <div id={QR_SCANNER_ID} style={{ width: '100%' }} />

      {/* Error state */}
      {camError && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#e07070',
          lineHeight: 1.5,
        }}>
          {camError}
        </div>
      )}

      {/* Instruction + cancel */}
      <div style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {scanning ? 'Point camera at Lana WIF QR code' : 'Starting camera…'}
        </span>
        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            padding: '5px 12px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function RelayBadge({ ok }: { ok: boolean | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: ok === null ? 'var(--text-secondary)' : ok ? '#4caf7d' : '#e55',
        boxShadow: ok === true ? '0 0 6px rgba(76,175,125,0.6)' : 'none',
        animation: ok === null ? 'mir-pulse 1.2s ease-in-out infinite' : 'none',
      }} />
      <span style={{ fontSize: '12px', color: ok === true ? '#6ec49a' : 'var(--text-secondary)' }}>
        {ok === null ? 'Checking relays…' : ok ? 'Relays connected' : 'Relay connection issues'}
      </span>
      <style>{`@keyframes mir-pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}

function StatusLine({ status }: { status: LoginStatus }) {
  if (status.state === 'idle')       return null;
  if (status.state === 'connecting') return <>Connecting to relays…</>;
  if (status.state === 'fetching')   return <>Fetching KIND 0 profile…</>;
  if (status.state === 'saving')     return <>Saving profile…</>;
  if (status.state === 'success')    return <>Welcome, {status.name}</>;
  if (status.state === 'error')      return <span style={{ color: '#e07070' }}>{status.message}</span>;
  return null;
}

function BusyLabel({ state }: { state: string }) {
  if (state === 'connecting') return <>Connecting…</>;
  if (state === 'fetching')   return <>Fetching profile…</>;
  return <>Signing in…</>;
}

function statusColor(state: string) {
  if (state === 'success') return '#6ec49a';
  if (state === 'error')   return '#e07070';
  return 'var(--text-secondary)';
}

function SuccessPreview({ name }: { name: string }) {
  return (
    <div style={{
      marginTop: '18px',
      padding: '14px 20px',
      background: 'color-mix(in srgb, var(--gold) 7%, transparent)',
      border: '1px solid color-mix(in srgb, var(--gold) 20%, transparent)',
      borderRadius: '12px',
      textAlign: 'center',
      width: '100%',
      boxSizing: 'border-box',
      animation: 'slideUp 0.35s ease',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '4px', color: 'var(--gold)' }}>✦</div>
      <div style={{ fontSize: '15px', color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>{name}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Opening MIR…</div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function QRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Top-left QR square */}
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
      {/* Top-right QR square */}
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
      {/* Bottom-left QR square */}
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
      {/* Bottom-right dots */}
      <rect x="14" y="14" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="18" y="14" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="14" y="18" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="18" y="18" width="3" height="3" fill="currentColor" stroke="none"/>
    </svg>
  );
}
