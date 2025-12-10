import React from 'react';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function NotificationsBell({ unreadCount = 0, onClick, ariaControls }) {
  /** Bell icon button with unread badge; triggers opening the Notifications Center. */
  const { t } = useTranslation();
  return (
    <button
      className="card"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded="false"
      aria-controls={ariaControls}
      aria-label={t('notifications.openCenter')}
      title={t('notifications.openCenter')}
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 12,
        border: '1px solid rgba(17,24,39,0.08)',
        background: 'var(--color-surface)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer'
      }}
    >
      <span aria-hidden="true">🔔</span>
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 11,
            minWidth: 18,
            height: 18,
            padding: '0 6px',
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
