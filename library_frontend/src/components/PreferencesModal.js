import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getNotificationPreferences, setNotificationPreferences } from '../services/api';
import { useToast } from './ToastContext';

// PUBLIC_INTERFACE
export default function PreferencesModal({ open, onClose }) {
  /**
   * Modal to manage Notification Preferences.
   * - Categories enable toggles
   * - Frequency selection
   * - Snooze durations
   * Persists to localStorage via service helpers.
   */
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState(getNotificationPreferences());
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    // focus trap: focus the modal container on open
    setTimeout(() => { try { ref.current?.focus(); } catch {} }, 0);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const update = (patch) => {
    setPrefs((p) => ({ ...p, ...patch }));
  };

  const save = () => {
    setNotificationPreferences(prefs);
    showToast(t('notifications.toasts.preferencesSaved'));
    onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prefs-title"
      onClick={(e) => { if (e.currentTarget === e.target) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)',
        display: 'grid', placeItems: 'center', padding: 16, zIndex: 1000
      }}
    >
      <div
        className="card"
        ref={ref}
        tabIndex={-1}
        style={{ width: '100%', maxWidth: 560, padding: 16, outline: 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <h2 id="prefs-title" style={{ margin: '8px 0' }}>
            {t('notifications.preferences.title')}
          </h2>
          <button className="btn" onClick={onClose} aria-label={t('modal.close')}>
            {t('modal.close')}
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <fieldset className="card" style={{ padding: 12 }}>
            <legend style={{ fontWeight: 700 }}>{t('notifications.preferences.categories')}</legend>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!prefs.enableDueDate}
                onChange={(e) => update({ enableDueDate: e.target.checked })}
              />
              {t('notifications.categories.due_date')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!prefs.enableNewArrival}
                onChange={(e) => update({ enableNewArrival: e.target.checked })}
              />
              {t('notifications.categories.new_arrival')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!prefs.enablePersonalized}
                onChange={(e) => update({ enablePersonalized: e.target.checked })}
              />
              {t('notifications.categories.personalized')}
            </label>
          </fieldset>

          <fieldset className="card" style={{ padding: 12 }}>
            <legend style={{ fontWeight: 700 }}>{t('notifications.preferences.frequency')}</legend>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="freq"
                checked={prefs.frequency === 'immediate'}
                onChange={() => update({ frequency: 'immediate' })}
              />
              {t('notifications.frequency.immediate')}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="freq"
                checked={prefs.frequency === 'daily'}
                onChange={() => update({ frequency: 'daily' })}
              />
              {t('notifications.frequency.daily')}
            </label>
          </fieldset>

          <fieldset className="card" style={{ padding: 12 }}>
            <legend style={{ fontWeight: 700 }}>{t('notifications.preferences.snooze')}</legend>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {t('notifications.preferences.defaultSnooze')}
              <select
                value={String(prefs.defaultSnooze || 60)}
                onChange={(e) => update({ defaultSnooze: Number(e.target.value) })}
                aria-label={t('notifications.preferences.defaultSnooze')}
                className="card"
                style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid rgba(17,24,39,0.1)' }}
              >
                <option value="15">{t('notifications.snooze.15m')}</option>
                <option value="60">{t('notifications.snooze.1h')}</option>
                <option value="180">{t('notifications.snooze.3h')}</option>
                <option value="1440">{t('notifications.snooze.1d')}</option>
              </select>
            </label>
          </fieldset>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={onClose}>
            {t('notifications.actions.cancel')}
          </button>
          <button className="btn" onClick={save} style={{ background: 'var(--color-primary)' }}>
            {t('notifications.actions.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
