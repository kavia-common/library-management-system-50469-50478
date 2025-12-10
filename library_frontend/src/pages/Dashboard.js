import React, { useEffect, useMemo, useState } from 'react';
import { getCountsSummary, getRecentBooks, listBooks, getDueSoonAndOverdue } from '../services/books';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard page
   * - Shows summary cards: Total Books, Borrowed Books, Overdue count
   * - Recent Additions list
   * - Upcoming due dates list (top 5)
   */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [summary, setSummary] = useState({ total: 0, borrowed: 0 });
  const [recent, setRecent] = useState([]);
  const [all, setAll] = useState([]);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const [s, r, a] = await Promise.all([
        getCountsSummary(),
        getRecentBooks(5),
        listBooks('')
      ]);
      setSummary(s);
      setRecent(r);
      setAll(a);
    } catch (e) {
      setErr(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overdueCount = useMemo(() => getDueSoonAndOverdue(all, 3).overdue.length, [all]);
  const dueSoonList = useMemo(() => getDueSoonAndOverdue(all, 3).dueSoon.slice(0, 5), [all]);

  const cards = useMemo(() => ([
    { title: 'Total Books', value: summary.total, tone: 'primary', description: 'All books in catalog' },
    { title: 'Borrowed Books', value: summary.borrowed, tone: 'secondary', description: 'Currently checked out' },
    { title: 'Overdue', value: overdueCount, tone: 'danger', description: 'Past due date' },
  ]), [summary, overdueCount]);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Dashboard</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn" onClick={load} aria-label="Refresh dashboard">⟲ Refresh</button>
        </div>
      </div>

      {loading && (
        <div className="grid" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton" style={{ height: 22, width: '60%', borderRadius: 8, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 32, width: '40%', borderRadius: 8 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && err && (
        <div className="empty" role="alert">
          Error: {err}
        </div>
      )}

      {!loading && !err && (
        <>
          {/* Summary cards */}
          <div className="grid" style={{ marginBottom: 20 }}>
            {cards.map((c, idx) => (
              <div key={idx} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>{c.description}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
                  <strong style={{ fontSize: 18 }}>{c.title}</strong>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: c.tone === 'primary'
                        ? 'var(--color-primary)'
                        : (c.tone === 'danger' ? 'var(--color-error)' : 'var(--color-secondary)'),
                    }}
                    aria-live="polite"
                  >
                    {Number(c.value || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming due dates */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 18 }}>Upcoming Due Dates</strong>
              <span className="tag" style={{ background: 'var(--color-secondary)', color: '#fff' }}>
                {dueSoonList.length}
              </span>
            </div>
            {dueSoonList.length === 0 && <div className="empty">No upcoming due dates.</div>}
            {dueSoonList.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {dueSoonList.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: 12,
                      background: 'var(--color-surface)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>by {b.author || 'Unknown'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tag">
                        {b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent additions */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 18 }}>Recent Additions</strong>
              <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                Latest {recent.length} item{recent.length === 1 ? '' : 's'}
              </span>
            </div>
            {recent.length === 0 && <div className="empty">No recent books found.</div>}
            {recent.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {recent.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      padding: 12,
                      background: 'var(--color-surface)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>by {b.author || 'Unknown'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="tag" title={b.createdAt ? new Date(b.createdAt).toISOString() : ''}>
                        {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
