import React, { useEffect, useMemo, useState } from 'react';
import { getCountsSummary, getRecentBooks } from '../services/books';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard page
   * - Shows summary cards: Total Books, Borrowed Books, Recent Additions (list with timestamps)
   * - Uses services helpers (API-first, LS fallback)
   * - Includes loading/error states and responsive layout with Ocean Professional theme
   */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [summary, setSummary] = useState({ total: 0, borrowed: 0 });
  const [recent, setRecent] = useState([]);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const s = await getCountsSummary();
      const r = await getRecentBooks(5);
      setSummary(s);
      setRecent(r);
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

  const cards = useMemo(() => ([
    { title: 'Total Books', value: summary.total, tone: 'primary', description: 'All books in catalog' },
    { title: 'Borrowed Books', value: summary.borrowed, tone: 'secondary', description: 'Currently checked out' },
  ]), [summary]);

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
          {Array.from({ length: 3 }).map((_, i) => (
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
                      color: c.tone === 'primary' ? 'var(--color-primary)' : 'var(--color-secondary)',
                    }}
                    aria-live="polite"
                  >
                    {Number(c.value || 0)}
                  </span>
                </div>
              </div>
            ))}
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
