// ============================================================
// MIR — Journal Screen
// Past sessions, most recent first. Tap to expand transcript.
// ============================================================

import { useState, useEffect } from 'react';
import type { LanaSession } from '../lib/session';

const API_URL = import.meta.env.VITE_API_URL || '';

interface SessionEntry {
  id:            string;
  startedAt:     string;
  completedAt:   string | null;
  stageReached:  string | null;
  closingScript: string | null;
}

interface ExpandedSession {
  id:            string;
  closingScript: string | null;
  transcript:    Array<{ role: string; content: string }> | null;
}

interface JournalProps {
  session: LanaSession;
}

export default function Journal({ session }: JournalProps) {
  const [entries, setEntries]   = useState<SessionEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<ExpandedSession | null>(null);
  const [expanding, setExpanding] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/sessions/${session.hexPubKey}`)
      .then(r => r.json())
      .then(data => setEntries(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session.hexPubKey]);

  async function handleExpand(entry: SessionEntry) {
    if (expanded?.id === entry.id) {
      setExpanded(null);
      return;
    }
    setExpanding(entry.id);
    try {
      const r = await fetch(`${API_URL}/api/sessions/detail/${entry.id}`);
      const data = await r.json();
      setExpanded({
        id:            data.id,
        closingScript: data.closingScript,
        transcript:    data.transcript,
      });
    } catch {
      setExpanded({ id: entry.id, closingScript: entry.closingScript, transcript: null });
    } finally {
      setExpanding(null);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'sans-serif',
      paddingBottom: '80px',
    }}>

      <div style={{
        padding: '28px 24px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text)',
          fontFamily: 'Georgia, serif',
          letterSpacing: '0.04em',
        }}>
          Journal
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {entries.length > 0 ? `${entries.length} evening${entries.length === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
            Loading…
          </p>
        )}

        {!loading && entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              No reviews yet.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              Your first review will appear here.
            </p>
          </div>
        )}

        {entries.map(entry => (
          <div key={entry.id}>
            <button
              onClick={() => handleExpand(entry)}
              style={{
                width: '100%',
                background: expanded?.id === entry.id
                  ? 'color-mix(in srgb, var(--gold) 7%, transparent)'
                  : 'var(--card-bg)',
                border: `1px solid ${expanded?.id === entry.id ? 'color-mix(in srgb, var(--gold) 20%, transparent)' : 'var(--border)'}`,
                borderRadius: '14px',
                padding: '16px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--gold)', fontFamily: 'Georgia, serif', fontWeight: 600 }}>
                    {formatDate(entry.startedAt)}
                  </div>
                  {entry.closingScript && (
                    <div style={{
                      marginTop: '6px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      // Show just first sentence
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    } as React.CSSProperties}>
                      {entry.closingScript.split('.')[0].trim()}.
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '18px',
                  color: 'var(--text-secondary)',
                  paddingLeft: '8px',
                  transition: 'transform 0.2s',
                  transform: expanded?.id === entry.id ? 'rotate(180deg)' : 'none',
                }}>
                  {expanding === entry.id ? '…' : '∨'}
                </div>
              </div>
            </button>

            {/* Expanded transcript */}
            {expanded?.id === entry.id && (
              <div style={{
                marginTop: '2px',
                background: 'var(--card-bg)',
                border: '1px solid color-mix(in srgb, var(--gold) 10%, transparent)',
                borderRadius: '0 0 14px 14px',
                padding: '20px 18px',
                borderTop: 'none',
              }}>
                {/* Full closing script */}
                {expanded.closingScript && (
                  <div style={{
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '16px',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}>
                    <p style={{
                      fontSize: '15px',
                      color: 'var(--gold)',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      lineHeight: 1.75,
                      margin: 0,
                    }}>
                      {expanded.closingScript}
                    </p>
                  </div>
                )}

                {/* Transcript */}
                {expanded.transcript && expanded.transcript.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {expanded.transcript.map((msg, i) => (
                      <div key={i} style={{
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: msg.role === 'user' ? 'var(--text)' : 'var(--text-secondary)',
                        fontFamily: msg.role === 'assistant' ? 'Georgia, serif' : 'sans-serif',
                        fontStyle: msg.role === 'assistant' ? 'italic' : 'normal',
                        paddingLeft: msg.role === 'user' ? '12px' : '0',
                        borderLeft: msg.role === 'user'
                          ? '2px solid color-mix(in srgb, var(--gold) 20%, transparent)'
                          : 'none',
                      }}>
                        {msg.content}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                    Transcript not available.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return iso.split('T')[0];
  }
}
