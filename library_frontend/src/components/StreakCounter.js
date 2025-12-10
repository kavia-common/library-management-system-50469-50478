import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PUBLIC_INTERFACE
 * Shows current daily reading streak and best streak with a CTA to keep streak.
 * Props:
 *  - stats: { currentStreak, bestStreak }
 *  - onLog: function to trigger logging dialog/flow
 */
export default function StreakCounter({ stats, onLog }) {
  const { t } = useTranslation();
  const current = stats?.currentStreak || 0;
  const best = stats?.bestStreak || 0;

  return (
    <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(245,158,11,0.12)'
        }}
      >
        <span style={{ fontSize: 22 }}>🔥</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>{t('gam.streak.title')}</div>
        <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>
          {t('gam.streak.current', { n: current })} • {t('gam.streak.best', { n: best })}
        </div>
      </div>
      <button className="btn" onClick={onLog} aria-label={t('gam.actions.logReading')}>
        {t('gam.actions.logReading')}
      </button>
    </div>
  );
}
