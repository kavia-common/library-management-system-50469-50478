import React from 'react';
import { useTranslation } from 'react-i18next';
import { getUserStats, recordReadingActivity, listBadgesCatalog } from '../services/gamification';
import StreakCounter from '../components/StreakCounter';
import AchievementsPanel from '../components/AchievementsPanel';
import Leaderboard from '../components/Leaderboard';
import { useToast } from '../components/ToastContext';

/**
 * PUBLIC_INTERFACE
 * Gamification page showing user streak, quick log activity, achievements, and leaderboard.
 */
export default function GamificationPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [stats, setStats] = React.useState(null);
  const [pages, setPages] = React.useState('');
  const [minutes, setMinutes] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    getUserStats()
      .then((s) => { if (active) setStats(s); })
      .finally(() => { if (active) setLoading(false); });
    const onStorage = (e) => {
      if (e.key === 'gamification:userStats') {
        setStats(JSON.parse(e.newValue || '{}'));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { active = false; window.removeEventListener('storage', onStorage); };
  }, []);

  const onLog = async () => {
    const p = Number(pages || 0);
    const m = Number(minutes || 0);
    const res = await recordReadingActivity({ pages: p, minutes: m });
    setStats(res);
    if (res?._newBadges?.length) {
      showToast(t('gam.toasts.badgeEarned', { name: t(res._newBadges[0].nameKey) }));
    } else if (res?.currentStreak && stats && res.currentStreak === stats.currentStreak) {
      showToast(t('gam.toasts.activityRecorded'));
    } else {
      showToast(t('gam.toasts.streakContinued'));
    }
    setPages('');
    setMinutes('');
  };

  if (loading) {
    return <div className="card" style={{ padding: 16 }}>{t('home.loading')}</div>;
  }

  const catalog = listBadgesCatalog();
  const owned = new Set((stats?.badges || []).map((b) => b.id));
  const next = catalog.find((b) => !owned.has(b.id));

  return (
    <section aria-label={t('gam.pageTitle')}>
      <div className="card" style={{ padding: 12, display: 'grid', gap: 10 }}>
        <h1 style={{ margin: '6px 0' }}>{t('gam.pageTitle')}</h1>
        <StreakCounter stats={stats} onLog={onLog} />
        <div className="card" style={{ padding: 10, display: 'flex', alignItems: 'end', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{t('gam.actions.logReading')}</div>
            <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{t('gam.log.subtitle')}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <label className="sr-only" htmlFor="log-pages">{t('gam.log.pages')}</label>
            <input
              id="log-pages"
              type="number"
              min="0"
              placeholder={t('gam.log.pages')}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="card"
              style={{ padding: '8px 10px', borderRadius: 8, width: 120, border: '1px solid rgba(17,24,39,0.1)' }}
            />
            <label className="sr-only" htmlFor="log-minutes">{t('gam.log.minutes')}</label>
            <input
              id="log-minutes"
              type="number"
              min="0"
              placeholder={t('gam.log.minutes')}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="card"
              style={{ padding: '8px 10px', borderRadius: 8, width: 120, border: '1px solid rgba(17,24,39,0.1)' }}
            />
            <button className="btn" onClick={onLog}>{t('gam.actions.saveLog')}</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <AchievementsPanel stats={stats} />
      </div>

      <div style={{ marginTop: 12 }}>
        <Leaderboard />
      </div>
    </section>
  );
}
