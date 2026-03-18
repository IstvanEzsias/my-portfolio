import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global reset
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; color: #e8e4d9; -webkit-font-smoothing: antialiased; }
  input, button, textarea { font-family: inherit; }
  input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #0e0e1e inset; -webkit-text-fill-color: #e8e4d9; }
`;
document.head.appendChild(style);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
