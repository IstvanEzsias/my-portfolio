// ============================================================
// MIR Logo — full hero or compact symbol
// Full (MirLogo): triskelion shield + "MIR" + "MAGIC IS REAL"
// Compact (MirSymbol): symbol only — for headers, small contexts
// Default export: auto-picks based on size (<=48 → compact)
// ============================================================

interface MirLogoProps {
  size?:        number;
  userInitial?: string;
  compact?:     boolean;
}

// ── Full hero logo ────────────────────────────────────────────
export function MirLogo({ size = 260, userInitial }: { size?: number; userInitial?: string }) {
  return (
    <svg width={size} height={size * 1.23} viewBox="0 0 260 320">
      <defs>
        <radialGradient id="sg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff8e7" stopOpacity="1"   />
          <stop offset="40%"  stopColor="#f5d080" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#c8a96e" stopOpacity="0"   />
        </radialGradient>
      </defs>
      <g transform="translate(130,145)">
        {/* Top lobe */}
        <path d="M0,-105 C17,-105 33,-95 41,-80 L71,-27 C80,-12 78,7 68,19 C57,11 43,8 29,8 L-29,8 C-43,8 -57,11 -68,19 C-78,7 -80,-12 -71,-27 L-41,-80 C-33,-95 -17,-105 0,-105 Z" fill="#00bcd4"/>
        {/* Bottom-right lobe */}
        <path d="M91,36 C102,19 118,10 136,10 L148,10 C165,10 179,19 187,34 L202,62 C211,77 209,96 199,109 C187,102 173,98 158,98 L123,98 C108,98 95,104 84,113 C71,102 71,83 80,68 Z" fill="#00bcd4"/>
        {/* Bottom-left lobe */}
        <path d="M-91,36 C-80,19 -64,10 -46,10 L-34,10 C-17,10 -3,19 5,34 L-16,68 C-7,83 -7,102 -20,113 C-31,104 -44,98 -59,98 L-94,98 C-109,98 -123,102 -135,109 C-145,96 -147,77 -138,62 Z" fill="#00bcd4"/>
        {/* Centre shield */}
        <ellipse cx="0" cy="5" rx="42" ry="52" fill="#080810" opacity="0.55"/>
        <path d="M0,-50 Q36,-50 36,4 Q36,46 0,60 Q-36,46 -36,4 Q-36,-50 0,-50 Z" fill="#1a1a6e"/>
        {userInitial ? (
          <text x="0" y="2" textAnchor="middle" dominantBaseline="central"
            fontFamily="Georgia,serif" fontSize="22" fill="#c8a96e" fontWeight="400">
            {userInitial}
          </text>
        ) : (
          <>
            <path d="M0,-48 L7,-18 L36,-18 L13,2 L20,32 L0,16 L-20,32 L-13,2 L-36,-18 L-7,-18 Z" fill="url(#sg)" opacity="0.95"/>
            <circle cx="0" cy="-4" r="4" fill="#fff8e7" opacity="0.98"/>
          </>
        )}
      </g>
      <text x="130" y="255" textAnchor="middle" fontFamily="Georgia,serif" fontSize="46" letterSpacing="14" fill="#c8a96e" fontWeight="400">MIR</text>
      <text x="130" y="286" textAnchor="middle" fontFamily="Georgia,serif" fontSize="11" letterSpacing="5" fill="#7a6a4a">MAGIC IS REAL</text>
    </svg>
  );
}

// ── Compact symbol (no text) ──────────────────────────────────
// Crops to just the triskelion portion — for chat headers, etc.
export function MirSymbol({ size = 32, userInitial }: { size?: number; userInitial?: string }) {
  const gid = `sg-sym-${size}`;
  return (
    <svg width={size} height={size} viewBox="50 30 160 185" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff8e7" stopOpacity="1"   />
          <stop offset="40%"  stopColor="#f5d080" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#c8a96e" stopOpacity="0"   />
        </radialGradient>
      </defs>
      <g transform="translate(130,145)">
        <path d="M0,-105 C17,-105 33,-95 41,-80 L71,-27 C80,-12 78,7 68,19 C57,11 43,8 29,8 L-29,8 C-43,8 -57,11 -68,19 C-78,7 -80,-12 -71,-27 L-41,-80 C-33,-95 -17,-105 0,-105 Z" fill="#00bcd4"/>
        <path d="M91,36 C102,19 118,10 136,10 L148,10 C165,10 179,19 187,34 L202,62 C211,77 209,96 199,109 C187,102 173,98 158,98 L123,98 C108,98 95,104 84,113 C71,102 71,83 80,68 Z" fill="#00bcd4"/>
        <path d="M-91,36 C-80,19 -64,10 -46,10 L-34,10 C-17,10 -3,19 5,34 L-16,68 C-7,83 -7,102 -20,113 C-31,104 -44,98 -59,98 L-94,98 C-109,98 -123,102 -135,109 C-145,96 -147,77 -138,62 Z" fill="#00bcd4"/>
        <ellipse cx="0" cy="5" rx="42" ry="52" fill="#080810" opacity="0.55"/>
        <path d="M0,-50 Q36,-50 36,4 Q36,46 0,60 Q-36,46 -36,4 Q-36,-50 0,-50 Z" fill="#1a1a6e"/>
        {userInitial ? (
          <text x="0" y="2" textAnchor="middle" dominantBaseline="central"
            fontFamily="Georgia,serif" fontSize="22" fill="#c8a96e" fontWeight="400">
            {userInitial}
          </text>
        ) : (
          <>
            <path d="M0,-48 L7,-18 L36,-18 L13,2 L20,32 L0,16 L-20,32 L-13,2 L-36,-18 L-7,-18 Z" fill={`url(#${gid})`} opacity="0.95"/>
            <circle cx="0" cy="-4" r="4" fill="#fff8e7" opacity="0.98"/>
          </>
        )}
      </g>
    </svg>
  );
}

// ── Default export: auto-selects based on size ────────────────
export default function MIRLogo({ size = 64, userInitial, compact = false }: MirLogoProps) {
  if (compact || size <= 48) {
    return <MirSymbol size={size} userInitial={userInitial} />;
  }
  return <MirLogo size={size} userInitial={userInitial} />;
}
