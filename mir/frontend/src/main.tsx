import { StrictMode, Component } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown) {
    console.error('[MIR] Render error caught by ErrorBoundary:', error);
  }
  render() {
    if (this.state.error) {
      const err = this.state.error;
      const message = err instanceof Error
        ? err.message
        : (typeof err === 'string' ? err : JSON.stringify(err));
      const stack = err instanceof Error ? err.stack : '';

      return (
        <div style={{
          padding: '24px', fontFamily: 'monospace', fontSize: '13px',
          color: '#c00', background: '#fff', whiteSpace: 'pre-wrap',
          wordBreak: 'break-word', minHeight: '100vh',
        }}>
          <strong>MIR render error — please screenshot and report:</strong>{'\n\n'}
          {message || '(no message)'}{'\n\n'}
          {stack}
          {'\n\n'}
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              location.reload();
            }}
            style={{
              marginTop: '16px', padding: '10px 20px',
              background: '#c00', color: '#fff', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Clear session &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
