export const theme = {
  // PUBLIC_INTERFACE
  colors: {
    /** Ocean Professional palette */
    primary: '#2563EB',
    secondary: '#F59E0B',
    success: '#F59E0B',
    error: '#EF4444',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    subtleText: '#6B7280',
    border: '#E5E7EB',
    muted: '#F3F4F6',
    overlay: 'rgba(17,24,39,0.65)',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 10px rgba(0,0,0,0.08)',
    lg: '0 10px 25px rgba(0,0,0,0.12)',
  },
  spacing: (n) => `${n * 4}px`,
};

// PUBLIC_INTERFACE
export function injectCssVariables() {
  /** Injects CSS variables into :root for easy styling in plain CSS */
  const root = document.documentElement;
  const set = (k, v) => root.style.setProperty(`--${k}`, v);
  set('color-primary', theme.colors.primary);
  set('color-secondary', theme.colors.secondary);
  set('color-success', theme.colors.success);
  set('color-error', theme.colors.error);
  set('color-bg', theme.colors.background);
  set('color-surface', theme.colors.surface);
  set('color-text', theme.colors.text);
  set('color-text-subtle', theme.colors.subtleText);
  set('color-border', theme.colors.border);
  set('color-muted', theme.colors.muted);
  set('color-overlay', theme.colors.overlay);

  set('radius-sm', theme.radius.sm);
  set('radius-md', theme.radius.md);
  set('radius-lg', theme.radius.lg);
  set('radius-xl', theme.radius.xl);

  set('shadow-sm', theme.shadow.sm);
  set('shadow-md', theme.shadow.md);
  set('shadow-lg', theme.shadow.lg);
}
