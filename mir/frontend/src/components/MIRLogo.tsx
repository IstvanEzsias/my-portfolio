// ============================================================
// MIR Logo — PNG-based hero + SVG compact symbol
// MirLogo:  uses /mir-logo.png + gold text
// MirSymbol: compact SVG triskelion for chat headers
// Default export: auto-picks based on size (<=48 → compact)
// ============================================================

interface MirLogoProps {
  size?:        number;
  userInitial?: string;
  compact?:     boolean;
}

// ── Full hero logo (PNG image + gold text) ────────────────────
export function MirLogo({ size = 200 }: { size?: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src="/mir-logo.png"
        width={size}
        height={size}
        alt="MIR"
        style={{ display: 'block', margin: '0 auto' }}
      />
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: '42px',
        letterSpacing: '14px',
        color: 'var(--gold)',
        marginTop: '8px',
      }}>
        MIR
      </div>
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        letterSpacing: '5px',
        color: 'var(--text-secondary)',
      }}>
        MAGIC IS REAL
      </div>
    </div>
  );
}

// ── Compact symbol (PNG, circular crop) ───────────────────────
// Used in chat headers, message bubbles
export function MirSymbol({ size = 48 }: { size?: number; userInitial?: string }) {
  return (
    <img
      src="/mir-logo.png"
      width={size}
      height={size}
      alt="MIR"
      style={{ borderRadius: '50%', objectFit: 'contain', background: 'transparent' }}
    />
  );
}

// ── Default export: auto-selects based on size ────────────────
export default function MIRLogo({ size = 64, userInitial, compact = false }: MirLogoProps) {
  if (compact || size <= 48) {
    return <MirSymbol size={size} userInitial={userInitial} />;
  }
  return <MirLogo size={size} />;
}
