import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PUBLIC_INTERFACE
 * Renders a badge emoji with tooltip, accessible labeling, and optional locked state.
 * Props:
 *  - badge: { id, nameKey, descKey, emoji }
 *  - earned: boolean
 *  - earnedAt?: string (ISO)
 *  - size?: number
 */
export default function BadgeIcon({ badge, earned = false, earnedAt = null, size = 28 }) {
  const { t } = useTranslation();
  const label = earned
    ? `${t(badge.nameKey)} — ${t('gam.badgeEarnedOn', { date: earnedAt ? new Date(earnedAt).toLocaleDateString() : '' })}`
    : `${t(badge.nameKey)} — ${t('gam.locked')}`;
  const emoji = badge.emoji || '🏅';
  const title = earned ? t(badge.descKey) : t('gam.locked');

  return (
    <div
      role="img"
      aria-label={label}
      title={title}
      tabIndex={0}
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 8,
        background: earned ? 'rgba(37,99,235,0.08)' : 'rgba(17,24,39,0.06)',
        color: 'var(--color-text)',
        outline: 'none'
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // focus-visible effect is handled by CSS box-shadow
        }
      }}
      className="card"
    >
      <span aria-hidden="true" style={{ filter: earned ? 'none' : 'grayscale(100%)', fontSize: size - 6 }}>
        {emoji}
      </span>
    </div>
  );
}
