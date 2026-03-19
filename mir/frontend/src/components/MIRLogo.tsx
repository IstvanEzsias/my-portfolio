// ============================================================
// MIR Logo — PNG-based hero + compact circular symbol
// MirLogo:   full hero with /mir-logo.png + gold text
// MirSymbol: small circular avatar using the same PNG
// Default export: auto-picks based on size (<=48 → compact)
// ============================================================

interface MirLogoProps {
  size?:    number;
  compact?: boolean;
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

// ── Compact circular symbol ───────────────────────────────────
// Used in Review header, Profile avatar fallback — full PNG in a circle.
// No SVG, no clipping artifacts, works in both light and dark mode.
export function MirSymbol({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/mir-logo.png"
      width={size}
      height={size}
      alt="MIR"
      style={{
        borderRadius: '50%',
        objectFit: 'contain',
        background: 'transparent',
        display: 'block',
      }}
    />
  );
}

// ── Default export: auto-selects based on size ────────────────
export default function MIRLogo({ size = 64, compact = false }: MirLogoProps) {
  if (compact || size <= 48) {
    return <MirSymbol size={size} />;
  }
  return <MirLogo size={size} />;
}
