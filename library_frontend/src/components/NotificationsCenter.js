import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  snoozeNotification,
  getNotificationPreferences
} from '../services/api';
import { useToast } from './ToastContext';

// PUBLIC_INTERFACE
export default function NotificationsCenter({ open, onClose, onNavigateToBook }) {
  /**
   * Modal/panel that lists notifications and allows actions.
   * Actions: View Book, Snooze, Mark as Read, Mark all as read
   */
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const ref = useRef(null);
  const [items, setItems] = React.useState(fetchNotifications());
  const prefs = getNotificationPreferences();
  const lang = i18n.language?.split('-')[0] || 'en';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    setTimeout(() => { try { ref.current?.focus(); } catch {} }, 0);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    // update list if underlying storage changes in same tab
    const onStorage = (e) => {
      if (e.key === 'notifications.list') {
        setItems(fetchNotifications());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    // refresh when opened
    setItems(fetchNotifications());
  }, [open]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const onMarkAsRead = (id) => {
    markAsRead(id);
    setItems(fetchNotifications());
    showToast(t('notifications.toasts.markedRead'));
  };

  const onMarkAll = () => {
    markAllAsRead();
    setItems(fetchNotifications());
    showToast(t('notifications.toasts.markedAll'));
  };

  const onSnooze = (n) => {
    const duration = prefs.defaultSnooze || 60;
    snoozeNotification(n.id, duration);
    setItems(fetchNotifications());
    showToast(t('notifications.toasts.snoozed', { minutes: duration }));
  };

  const onView = (n) => {
    if (n.bookId) {
      onNavigateToBook?.(n.bookId);
      markAsRead(n.id);
      setItems(fetchNotifications());
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-title"
      onClick={(e) => { if (e.currentTarget === e.target) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)',
        display: 'grid', placeItems: 'center', padding: 16, zIndex: 900
      }}
    >
      <div
        className="card"
        ref={ref}
        tabIndex={-1}
        id="notifications-center"
        style={{ width: '100%', maxWidth: 720, outline: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottom: '1px solid rgba(17,24,39,0.06)'
          }}
        >
          <div>
            <h2 id="notif-title" style={{ margin: '8px 0' }}>
              {t('notifications.title')}
            </h2>
            <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>
              {unreadCount > 0
                ? t('notifications.unreadCount', { count: unreadCount })
                : t('notifications.none')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onMarkAll} disabled={unreadCount === 0}>
              {t('notifications.actions.markAll')}
            </button>
            <button className="btn" onClick={onClose}>
              {t('modal.close')}
            </button>
          </div>
        </div>

        <div style={{ maxHeight: '60vh', overflow: 'auto', padding: 8 }}>
          {items.length === 0 ? (
            <div className="card" style={{ padding: 16, margin: 8 }}>
              {t('notifications.empty')}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((n) => (
                <li
                  key={n.id}
                  className="card"
                  style={{
                    margin: 8,
                    padding: 12,
                    background: n.read ? 'var(--color-surface)' : 'rgba(37,99,235,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span aria-hidden="true">
                          {n.type === 'due_date' ? '⏰' : n.type === 'new_arrival' ? '🆕' : '✨'}
                        </span>
                        {formatMessage(n, lang, t)}
                      </div>
                      <div style={{ color: 'var(--color-muted)', fontSize: 12, marginTop: 4 }}>
                        {new Date(n.timestamp).toLocaleString()}
                        {n.snoozedUntil ? ` • ${t('notifications.snoozedUntil', { time: new Date(n.snoozedUntil).toLocaleString() })}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {n.bookId && (
                        <button className="btn" onClick={() => onView(n)}>{t('notifications.actions.viewBook')}</button>
                      )}
                      <button className="btn" onClick={() => onSnooze(n)}>{t('notifications.actions.snooze')}</button>
                      {!n.read && (
                        <button className="btn" onClick={() => onMarkAsRead(n.id)}>{t('notifications.actions.mark')}</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatMessage(n, lang, t) {
  if (n.type === 'due_date') {
    const days = Math.max(0, Math.ceil((n.dueAt - Date.now()) / (24 * 60 * 60 * 1000)));
    return t('notifications.messages.dueSoon', { title: n.bookTitle || '', days });
  }
  if (n.type === 'new_arrival') {
    return t('notifications.messages.newArrival', { title: n.bookTitle || '' });
  }
  return t('notifications.messages.personalized', { title: n.bookTitle || '' });
}
