import React, { useEffect, useRef } from 'react';

// PUBLIC_INTERFACE
export default function ConfirmDialog({ title = 'Confirm', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, tone = 'default' }) {
  /**
   * Accessible confirmation dialog used for destructive actions like delete.
   */
  const panelRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
      if (e.key === 'Tab') {
        // focus trap
        const focusable = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || [];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [onCancel]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-panel" ref={panelRef}>
        <div className="modal-header">
          <strong id="confirm-title" style={{ fontSize: 18 }}>{title}</strong>
          <button className="modal-close" onClick={onCancel} aria-label="Close dialog" ref={firstRef}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn" style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }} onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="btn" style={{ background: tone === 'danger' ? 'var(--color-error)' : 'var(--color-primary)' }} onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
