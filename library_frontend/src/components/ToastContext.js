import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * ToastProvider supplies a simple toast/snackbar system for transient feedback.
 * Usage:
 *  const { showToast } = useToast();
 *  showToast(t('notifications.toasts.markedRead'));
 */
const ToastCtx = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, opts = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = typeof opts.duration === 'number' ? opts.duration : 2500;
    setToasts((prev) => [...prev, { id, message }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'grid',
          gap: 8,
          zIndex: 2000
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card"
            role="status"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              padding: '10px 12px',
              borderRadius: 10,
              boxShadow: 'var(--shadow-md)',
              minWidth: 200,
              maxWidth: 360
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  /** Access the showToast function to display snackbars. */
  return useContext(ToastCtx);
}
