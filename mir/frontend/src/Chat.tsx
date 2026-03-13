// ============================================================
// MIR — Chat Interface
// The AI companion conversation UI
// ============================================================

import { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ── Types ────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatProps {
  userId?: number;
  reviewId?: number;
}

// ── Main Chat Component ──────────────────────────────────────
export default function Chat({ userId, reviewId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load opening message on mount
  useEffect(() => {
    loadOpeningMessage();
  }, []);

  // Auto-scroll to bottom
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

  async function loadOpeningMessage() {
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', String(userId));
      if (reviewId) params.set('reviewId', String(reviewId));

      const res = await fetch(`${API_URL}/api/chat/opening?${params}`);
      const data = await res.json();

      setMessages([{
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date()
      }]);
    } catch {
      setMessages([{
        role: 'assistant',
        content: "The day is settling.\n\nWhat's sitting with you tonight?",
        timestamp: new Date()
      }]);
    } finally {
      setOpening(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          userId,
          reviewId
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Something interrupted the connection. Take a breath — I'm still here.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
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
      background: '#1a1a2e',
      color: '#e8e6df',
      fontFamily: "'Georgia', serif",
      maxWidth: '680px',
      margin: '0 auto',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.03)',
        flexShrink: 0,
      }}>
        <MIRLogo size={32} />
        <div>
          <div style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '0.05em', color: '#e8e6df' }}>
            MIR
          </div>
          <div style={{ fontSize: '12px', color: '#8a8880', fontFamily: 'sans-serif' }}>
            your inner companion
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {opening && (
          <div style={{ textAlign: 'center', color: '#5a5850', fontSize: '14px', fontFamily: 'sans-serif' }}>
            <PulsingDot />
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MIRLogo size={24} />
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '10px 14px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: '#e8e6df',
              fontFamily: "'Georgia', serif",
              fontSize: '15px',
              lineHeight: '1.5',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? '#c8a96e' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l3 6-3 6 12-6z" fill={input.trim() && !loading ? '#1a1a2e' : '#666'} />
            </svg>
          </button>
        </div>
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          fontSize: '11px',
          color: '#4a4840',
          fontFamily: 'sans-serif',
        }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {!isUser && <MIRLogo size={28} style={{ flexShrink: 0, marginTop: '2px' }} />}

      <div style={{
        maxWidth: '78%',
        background: isUser
          ? 'rgba(200, 169, 110, 0.15)'
          : 'rgba(255,255,255,0.05)',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: '12px 16px',
        border: `1px solid ${isUser ? 'rgba(200,169,110,0.2)' : 'rgba(255,255,255,0.07)'}`,
      }}>
        <div style={{
          fontSize: '15px',
          lineHeight: '1.65',
          color: isUser ? '#d4b97a' : '#ddd8d0',
          whiteSpace: 'pre-wrap',
          fontFamily: isUser ? 'sans-serif' : "'Georgia', serif",
        }}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

// ── MIR Logo (triquetra-inspired) ────────────────────────────
function MIRLogo({ size = 32, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #1a1a4e, #0d2a4a)',
      border: '1.5px solid rgba(0, 200, 220, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 0 8px rgba(0, 200, 220, 0.15)',
      ...style,
    }}>
      <span style={{
        fontSize: size * 0.42,
        color: '#ff6040',
        fontStyle: 'italic',
        fontWeight: 700,
        textShadow: '0 0 6px rgba(255, 96, 64, 0.6)',
        lineHeight: 1,
      }}>
        I
      </span>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#c8a96e',
          opacity: 0.5,
          animation: `mir-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes mir-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// ── Pulsing dot for loading state ────────────────────────────
function PulsingDot() {
  return (
    <div style={{
      width: '8px', height: '8px', borderRadius: '50%',
      background: '#c8a96e', margin: '0 auto',
      animation: 'mir-pulse 1.2s ease-in-out infinite',
    }} />
  );
}
