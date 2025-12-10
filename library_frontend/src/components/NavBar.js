import React from 'react';
import { useTheme } from '../theme/ThemeContext';

// PUBLIC_INTERFACE
export default function NavBar() {
  /** Top navigation bar with brand and theme toggle. */
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="navbar card"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        margin: 0,
        borderRadius: 0,
        padding: '14px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid rgba(17,24,39,0.06)',
      }}
      aria-label="Top navigation"
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(37,99,235,.15), rgba(245,158,11,.15))',
              display: 'grid', placeItems: 'center'
            }}
          >
            <span style={{ color: 'var(--color-primary)' }}>📚</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: .2, color: 'var(--color-text)' }}>
              Ocean Library
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
              Browse and discover books
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            className="btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
    </nav>
  );
}
