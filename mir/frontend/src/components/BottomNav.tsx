// ============================================================
// MIR — Bottom Navigation
// Home | Review | Journal | Profile
// ============================================================

export type Page = 'home' | 'review' | 'journal' | 'profile';

interface BottomNavProps {
  current: Page;
  onChange: (page: Page) => void;
}

const ITEMS: Array<{ page: Page; label: string; icon: () => JSX.Element }> = [
  {
    page: 'home',
    label: 'Home',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    page: 'review',
    label: 'Review',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    page: 'journal',
    label: 'Journal',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7"  x2="16" y2="7"  />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    page: 'profile',
    label: 'Profile',
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '62px',
      background: 'rgba(8,8,16,0.96)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 50,
    }}>
      {ITEMS.map(({ page, label, icon: Icon }) => {
        const active = current === page;
        return (
          <button
            key={page}
            onClick={() => onChange(page)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              color: active ? '#c8a96e' : '#5a5650',
              transition: 'color 0.2s',
              padding: '8px 0',
            }}
          >
            <Icon />
            <span style={{
              fontSize: '10px',
              fontFamily: 'sans-serif',
              letterSpacing: '0.04em',
              fontWeight: active ? 600 : 400,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
