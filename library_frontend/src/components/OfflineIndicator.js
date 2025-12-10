import React from 'react';
import { useTranslation } from 'react-i18next';
import { isOnline, onConnectivityChange } from '../services/sync';

// PUBLIC_INTERFACE
export default function OfflineIndicator() {
  /** Inline indicator of connectivity status with tooltip and ARIA label. */
  const { t } = useTranslation();
  const [online, setOnline] = React.useState(isOnline());

  React.useEffect(() => {
    const unsub = onConnectivityChange(setOnline);
    return () => unsub();
  }, []);

  const label = online ? t('offline.online') : t('offline.offline');
  const color = online ? '#10B981' : '#EF4444';

  return (
    <div
      role="status"
      aria-label={label}
      title={label}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          boxShadow: '0 0 0 2px rgba(0,0,0,0.05)'
        }}
      />
    </div>
  );
}
