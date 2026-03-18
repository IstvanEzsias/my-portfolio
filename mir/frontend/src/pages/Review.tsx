// ============================================================
// MIR — Review / Chat Screen
// The evening review conversation with closing script renderer
// ============================================================

import { useState, useEffect, useRef } from 'react';
import type { LanaSession } from '../lib/session';
import { MirSymbol } from '../components/MIRLogo';

const API_URL = import.meta.env.VITE_API_URL || '';

// ── Types ─────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReviewProps {
  session: LanaSession;
  onComplete: () => void; // navigate back to home after completion
}

// ── Closing script parser ────────────────────────────────────
// Splits AI message into [preScript, closingScript] parts
function parseClosingScript(content: string): { before: string; script: string | null } {
  const match = content.match(/\[CLOSING SCRIPT\]([\s\S]*?)\[\/CLOSING SCRIPT\]/i);
  if (!match) return { before: content, script: null };
  const before = content.slice(0, match.index).trim();
  const script = match[1].trim();
  return { before, script };
}

// ── Main Component ────────────────────────────────────────────
export default function Review({ session, onComplete }: ReviewProps) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [opening, setOpening]         = useState(true);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [completed, setCompleted]     = useState(false);
  const [completing, setCompleting]   = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect if any message contains a closing script
  const closingScriptMsg = messages.find(
    m => m.role === 'assistant' && /\[CLOSING SCRIPT\]/i.test(m.content)
  );
  const hasClosingScript = !!closingScriptMsg && !completed;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Start session + opening message on mount
  useEffect(() => {
    startSession();
  }, []);

  async function startSession() {
    // Create backend session
    let sid: string | null = null;
    try {
      const r = await fetch(`${API_URL}/api/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nostrPubkey: session.hexPubKey }),
      });
      const data = await r.json();
      sid = data.sessionId ?? null;
      setSessionId(sid);
    } catch {
      // Non-fatal — continue without session tracking
    }

    // Load opening message
    try {
      const params = new URLSearchParams();
      if (session.hexPubKey) params.set('nostrPubkey', session.hexPubKey);
      const r = await fetch(`${API_URL}/api/chat/opening?${params}`);
      const data = await r.json();
      setMessages([{ role: 'assistant', content: data.message.content }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: "The day is settling.\n\nWhat's sitting with you tonight?"
      }]);
    } finally {
      setOpening(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const r = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          nostrPubkey: session.hexPubKey,
          sessionId,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.message.content }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Something interrupted the connection. Take a breath — I'm still here.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function completeReview() {
    if (completing || completed) return;
    setCompleting(true);

    // Extract closing script text
    const { script } = closingScriptMsg
      ? parseClosingScript(closingScriptMsg.content)
      : { script: null };

    try {
      await fetch(`${API_URL}/api/sessions/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          nostrPubkey:    session.hexPubKey,
          fullTranscript: messages,
          closingScript:  script,
          stageReached:   'complete',
        }),
      });
    } catch {
      // Non-fatal
    } finally {
      setCompleted(true);
      setCompleting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: '#080810',
      color: '#e8e4d9',
      fontFamily: "'Georgia', serif",
      maxWidth: '680px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <MirSymbol
            size={30}
            userInitial={(session.profile?.display_name ?? session.profile?.name ?? 'L')[0]?.toUpperCase()}
          />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '0.06em', color: '#c8a96e' }}>
              MIR
            </div>
            <div style={{ fontSize: '11px', color: '#5a5650', fontFamily: 'sans-serif' }}>
              evening review
            </div>
          </div>
        </div>

        {/* Complete Review button — appears when closing script is present */}
        {hasClosingScript && !completed && (
          <button
            onClick={completeReview}
            disabled={completing}
            style={{
              padding: '7px 14px',
              background: 'rgba(200,169,110,0.12)',
              border: '1px solid rgba(200,169,110,0.3)',
              borderRadius: '8px',
              color: '#c8a96e',
              fontSize: '12px',
              fontFamily: 'sans-serif',
              cursor: 'pointer',
            }}
          >
            {completing ? 'Saving…' : 'Complete Review'}
          </button>
        )}

        {completed && (
          <button
            onClick={onComplete}
            style={{
              padding: '7px 14px',
              background: 'rgba(200,169,110,0.12)',
              border: '1px solid rgba(200,169,110,0.3)',
              borderRadius: '8px',
              color: '#c8a96e',
              fontSize: '12px',
              fontFamily: 'sans-serif',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        {opening && <PulsingDot />}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MirSymbol size={24} />
            <TypingIndicator />
          </div>
        )}

        {completed && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            color: '#5a5650',
            fontSize: '13px',
            fontFamily: 'sans-serif',
            fontStyle: 'italic',
          }}>
            Review complete. Rest well.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!completed && (
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '14px',
            padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share what's on your heart…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: '#e8e4d9',
                fontFamily: "'Georgia', serif",
                fontSize: '15px',
                lineHeight: '1.55',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? '#c8a96e' : 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '9px',
                width: '34px',
                height: '34px',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l3 6-3 6 12-6z" fill={input.trim() && !loading ? '#080810' : '#555'} />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (!isUser) {
    const { before, script } = parseClosingScript(message.content);
    return (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, marginTop: '3px' }}><MirSymbol size={26} /></div>
        <div style={{ maxWidth: '84%' }}>
          {before && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '4px 16px 16px 16px',
              padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '15px',
              lineHeight: '1.65',
              color: '#ddd8d0',
              whiteSpace: 'pre-wrap',
              marginBottom: script ? '16px' : '0',
            }}>
              {before}
            </div>
          )}
          {script && <ClosingScriptBlock text={script} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '78%',
        background: 'rgba(30,26,50,0.9)',
        borderRadius: '16px 4px 16px 16px',
        padding: '11px 15px',
        border: '1px solid rgba(200,169,110,0.12)',
        fontSize: '15px',
        lineHeight: '1.55',
        color: '#c4b898',
        whiteSpace: 'pre-wrap',
        fontFamily: 'sans-serif',
      }}>
        {message.content}
      </div>
    </div>
  );
}

// ── Closing Script Block ──────────────────────────────────────
function ClosingScriptBlock({ text }: { text: string }) {
  return (
    <div style={{
      borderTop: '1px solid rgba(200,169,110,0.3)',
      paddingTop: '18px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '17px',
        lineHeight: '1.75',
        color: '#c8a96e',
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        margin: 0,
        padding: '0 8px',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </p>
    </div>
  );
}

// ── Animations ────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: '#c8a96e', opacity: 0.5,
          animation: `mir-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes mir-bounce {
          0%,100% { opacity:.3; transform:scale(.8) }
          50%      { opacity:1;  transform:scale(1.1) }
        }
      `}</style>
    </div>
  );
}

function PulsingDot() {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: '#c8a96e', margin: '0 auto',
        animation: 'mir-bounce 1.2s ease-in-out infinite',
      }} />
    </div>
  );
}
