import React from 'react';
import { useTranslation } from 'react-i18next';
import BadgeIcon from './BadgeIcon';

/**
 * PUBLIC_INTERFACE
 * Compact header widget showing points, current streak, and next/last badge.
 * Props:
 *  - stats: user stats
 *  - nextBadge?: badge meta
 *  - onClick?: handler to navigate to full page
 */
export default function GamificationSummary({ stats, nextBadge, onClick }) {
  const { t } = useTranslation();
  const lastBadge = (stats?.badges || []).slice().sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))[0];

  return (
    <button
      type="button"
      className="card"
      onClick={onClick}
      aria-label={t('gam.summary.open')}
      data-testid="gam-summary"
      style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--color-surface)' }}
    >
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontWeight: 800 }}>{t('gam.summary.title')}</div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
          {t('gam.summary.points', { n: stats?.points || 0 })} • {t('gam.streak.current', { n: stats?.currentStreak || 0 })}
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {lastBadge ? (
          <div title={t('gam.summary.lastBadge')}>
            <BadgeIcon badge={lastBadge} earned size={26} earnedAt={lastBadge.earnedAt} />
          </div>
        ) : null}
        {nextBadge ? (
          <div title={t('gam.summary.nextBadge')}>
            <BadgeIcon badge={nextBadge} earned={false} size={26} />
          </div>
        ) : null}
      </div>
    </button>
  );
}
