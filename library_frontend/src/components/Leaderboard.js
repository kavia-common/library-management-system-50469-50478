import React from 'react';
import { useTranslation } from 'react-i18next';
import { getLeaderboard } from '../services/gamification';

/**
 * PUBLIC_INTERFACE
 * Leaderboard with simple period tabs (weekly/monthly/all-time), keyboard navigation, and pagination (client-side).
 */
export default function Leaderboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = React.useState('all');
  const [rows, setRows] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const isReduced = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  React.useEffect(() => {
    let active = true;
    getLeaderboard({ period: period === 'all' ? 'all' : period })
      .then((list) => { if (active) setRows(list || []); })
      .catch(() => { if (active) setRows([]); });
    return () => { active = false; };
  }, [period]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (page - 1) * pageSize;
  const current = rows.slice(start, start + pageSize);

  const changePeriod = (p) => {
    setPeriod(p);
    setPage(1);
  };

  const onKeyDownRow = (e, idx) => {
    if (e.key === 'ArrowDown') {
      const next = Math.min(current.length - 1, idx + 1);
      e.preventDefault();
      const el = document.querySelector(`[data-lb-row="${next}"]`);
      if (el) el.focus({ preventScroll: false });
    } else if (e.key === 'ArrowUp') {
      const prev = Math.max(0, idx - 1);
      e.preventDefault();
      const el = document.querySelector(`[data-lb-row="${prev}"]`);
      if (el) el.focus({ preventScroll: false });
    }
  };

  return (
    <section className="card" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 8 }}>
        <div>
          <h2 style={{ margin: '6px 0' }}>{t('gam.leaderboard.title')}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn"
              onClick={() => changePeriod('weekly')}
              aria-pressed={period === 'weekly'}
              style={{ background: period === 'weekly' ? 'var(--color-primary)' : 'rgba(17,24,39,0.08)' }}
            >
              {t('gam.period.weekly')}
            </button>
            <button
              className="btn"
              onClick={() => changePeriod('monthly')}
              aria-pressed={period === 'monthly'}
              style={{ background: period === 'monthly' ? 'var(--color-primary)' : 'rgba(17,24,39,0.08)' }}
            >
              {t('gam.period.monthly')}
            </button>
            <button
              className="btn"
              onClick={() => changePeriod('all')}
              aria-pressed={period === 'all'}
              style={{ background: period === 'all' ? 'var(--color-primary)' : 'rgba(17,24,39,0.08)' }}
            >
              {t('gam.period.all')}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>←</button>
          <div style={{ display: 'grid', placeItems: 'center' }}>{page}/{totalPages}</div>
          <button className="btn" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>→</button>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div role="table" aria-label={t('gam.leaderboard.title')}>
          <div role="rowgroup">
            <div role="row" className="card" style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px', padding: 8, background: 'rgba(17,24,39,0.04)' }}>
              <div role="columnheader" style={{ fontWeight: 700 }}>#</div>
              <div role="columnheader" style={{ fontWeight: 700 }}>{t('gam.leaderboard.player')}</div>
              <div role="columnheader" style={{ fontWeight: 700 }}>{t('gam.leaderboard.points')}</div>
              <div role="columnheader" style={{ fontWeight: 700 }}>{t('gam.leaderboard.streak')}</div>
            </div>
          </div>
          <div role="rowgroup">
            {current.map((r, idx) => (
              <div
                role="row"
                key={`${r.userId}-${r.rank}`}
                className="card"
                tabIndex={0}
                data-lb-row={idx}
                onKeyDown={(e) => onKeyDownRow(e, idx)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 120px',
                  padding: 8,
                  marginTop: 6,
                  transition: isReduced ? 'none' : 'transform .15s ease'
                }}
              >
                <div role="cell">#{r.rank}</div>
                <div role="cell" style={{ fontWeight: r.rank <= 3 ? 800 : 500 }}>
                  {r.displayName || '—'}
                </div>
                <div role="cell">{r.points ?? 0}</div>
                <div role="cell">🔥 {r.currentStreak ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
