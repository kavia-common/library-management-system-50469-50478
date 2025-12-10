import React from 'react';
import { useTranslation } from 'react-i18next';
import BadgeIcon from './BadgeIcon';
import { listBadgesCatalog } from '../services/gamification';

/**
 * PUBLIC_INTERFACE
 * Lists earned and locked achievements. Shows progress bars for in-progress milestones.
 * Props:
 *  - stats: { badges: [...], progress: {...} }
 */
export default function AchievementsPanel({ stats }) {
  const { t } = useTranslation();
  const catalog = listBadgesCatalog();
  const earnedIds = new Set((stats?.badges || []).map((b) => b.id));

  const rows = catalog.map((meta) => {
    const earned = (stats?.badges || []).find((b) => b.id === meta.id);
    return { meta, earned, isEarned: !!earned };
  });

  const progress = stats?.progress || {};
  const progItems = [
    { id: 'pages_100', label: t('gam.progress.pages100'), value: progress.pages100 || 0 },
    { id: 'early_bird', label: t('gam.progress.earlyBird'), value: Math.min(100, Math.round(((progress.earlyBirdDays || 0) / 3) * 100)) },
    { id: 'night_owl', label: t('gam.progress.nightOwl'), value: Math.min(100, Math.round(((progress.nightOwlDays || 0) / 3) * 100)) }
  ];

  return (
    <section className="card" style={{ padding: 12 }}>
      <h2 style={{ marginTop: 6, marginBottom: 8 }}>{t('gam.achievements.title')}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
        {rows.map((row) => (
          <div key={row.meta.id} className="card" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <BadgeIcon badge={row.meta} earned={row.isEarned} earnedAt={row.earned?.earnedAt} />
            <div>
              <div style={{ fontWeight: 700 }}>{t(row.meta.nameKey)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                {t(row.meta.descKey)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ margin: '8px 0' }}>{t('gam.achievements.progress')}</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {progItems.map((p) => (
            <div key={p.id}>
              <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 4 }}>{p.label}</div>
              <div className="card" style={{ height: 10, background: 'rgba(17,24,39,0.06)', overflow: 'hidden' }} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.value} role="progressbar">
                <div style={{
                  width: `${p.value}%`,
                  height: '100%',
                  background: 'var(--color-primary)',
                  transition: 'width .3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
