// ============================================================
// MIR — Profile Screen
// User identity, review count, growth summary, sign out
// ============================================================

import { useState, useEffect } from 'react';
import type { LanaSession } from '../lib/session';
import { MirSymbol } from '../components/MIRLogo';

const API_URL = import.meta.env.VITE_API_URL || '';

interface BackendProfile {
  nostrPubkey:  string;
  nostrNpub:    string;
  displayName:  string | null;
  avatarUrl:    string | null;
  about:        string | null;
  firstSeen:    string | null;
  lastSeen:     string | null;
  reviewCount:  number;
}

interface GrowthSummary {
  summary:         string;
  recurringThemes: string | null;
  generatedAt:     string;
  sessionsCovered: number;
}

interface ProfileProps {
  session:  LanaSession;
  onLogout: () => void;
}

export default function Profile({ session, onLogout }: ProfileProps) {
  const [profile, setProfile]           = useState<BackendProfile | null>(null);
  const [growthSummary, setGrowthSummary] = useState<GrowthSummary | null>(null);
  const [loading, setLoading]           = useState(true);

  const nostrProfile = session.profile;
  const displayName  = profile?.displayName ?? nostrProfile?.display_name ?? nostrProfile?.name ?? 'Lana User';
  const avatarUrl    = profile?.avatarUrl ?? nostrProfile?.picture ?? undefined;
  const initial      = displayName[0]?.toUpperCase() ?? 'L';
  const npub         = session.npub;
  const shortNpub    = `${npub.slice(0, 12)}…${npub.slice(-6)}`;

  useEffect(() => {
    fetch(`${API_URL}/api/profile/${session.hexPubKey}`)
      .then(r => r.json())
      .then(data => {
        if (data.profile)       setProfile(data.profile);
        if (data.growthSummary) setGrowthSummary(data.growthSummary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session.hexPubKey]);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'sans-serif',
      paddingBottom: '80px',
    }}>

      {/* Avatar + name block */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 28px',
        borderBottom: '1px solid var(--border)',
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <MirSymbol size={72} userInitial={initial} />
        }
        <h2 style={{
          marginTop: '16px',
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--text)',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
        }}>
          {displayName}
        </h2>
        {nostrProfile?.about && (
          <p style={{
            marginTop: '6px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            maxWidth: '280px',
            lineHeight: 1.5,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}>
            {nostrProfile.about}
          </p>
        )}
        <p style={{
          marginTop: '8px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: 'monospace',
        }}>
          {shortNpub}
        </p>
      </div>

      {/* Stats */}
      <div style={{ padding: '24px', display: 'flex', gap: '16px' }}>
        <StatCard
          value={loading ? '…' : String(profile?.reviewCount ?? 0)}
          label="Reviews"
        />
        {profile?.firstSeen && (
          <StatCard
            value={formatDate(profile.firstSeen)}
            label="First review"
          />
        )}
      </div>

      {/* Growth summary */}
      {growthSummary && (
        <div style={{ padding: '0 24px 24px' }}>
          <h3 style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}>
            Recent Growth
          </h3>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px',
          }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text)',
              fontFamily: 'Georgia, serif',
              lineHeight: 1.7,
              margin: 0,
              fontStyle: 'italic',
            }}>
              {growthSummary.summary}
            </p>
            {growthSummary.recurringThemes && (
              <p style={{
                marginTop: '10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                Themes: {growthSummary.recurringThemes}
              </p>
            )}
            <p style={{
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}>
              From {growthSummary.sessionsCovered} sessions · {formatDate(growthSummary.generatedAt)}
            </p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={{ padding: '0 24px' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '22px', fontWeight: 600, color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', letterSpacing: '0.04em' }}>
        {label}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso.split('T')[0];
  }
}
