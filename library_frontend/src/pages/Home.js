import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BookGrid from '../components/BookGrid';
import { EmptyState, LoadingSkeleton } from '../components/States';
import BookDetailsModal from '../components/BookDetailsModal';
import { listBooks, getDueSoonAndOverdue } from '../services/books';
import { getFavorites, toggleFavorite } from '../services/favorites';
import { getReviews } from '../services/reviews';
import useNavigateToBook from '../hooks/useNavigateToBook';

// PUBLIC_INTERFACE
export default function Home() {
  const [query, setQuery] = useState('');
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [averageRatings, setAverageRatings] = useState({});
  const goToBook = useNavigateToBook();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr('');
    (async () => {
      try {
        const data = await listBooks('');
        if (alive) setAllBooks(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setErr(e.message || 'Failed to load books');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const favs = await getFavorites();
        if (alive) setFavoriteIds(favs);
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    // Load average rating per book in background
    let alive = true;
    (async () => {
      try {
        const entries = await Promise.all(
          (allBooks || []).map(async (b) => {
            try {
              const { average } = await getReviews(b.id);
              return [String(b.id), Number(average) || 0];
            } catch {
              return [String(b.id), Number(b.rating) || 0];
            }
          })
        );
        if (alive) {
          const map = {};
          for (const [id, avg] of entries) map[id] = avg;
          setAverageRatings(map);
        }
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, [allBooks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = allBooks;
    if (showOnlyFavorites) {
      base = base.filter(b => favoriteIds.includes(String(b.id)));
    }
    if (!q) return base;
    return base.filter(b => {
      const hay = [
        b.title || '',
        b.author || '',
        (b.genres || []).join(' ')
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [allBooks, query, favoriteIds, showOnlyFavorites]);

  const reminders = useMemo(() => getDueSoonAndOverdue(allBooks, 3), [allBooks]);

  const onToggleFavorite = async (id) => {
    try {
      const next = await toggleFavorite(id);
      setFavoriteIds(next);
    } catch (e) {
      console.warn('Toggle favorite failed:', e.message);
    }
  };

  const reminderCard = (title, list, tone) => (
    <div className="card" style={{ padding: 12, borderColor: tone === 'danger' ? 'var(--color-error)' : 'var(--color-secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ fontSize: 14 }}>
          {title}
        </strong>
        <span className="tag" style={{ background: tone === 'danger' ? 'var(--color-error)' : 'var(--color-secondary)', color: '#fff' }}>
          {list.length}
        </span>
      </div>
      {list.length === 0 && <div className="empty" style={{ padding: 12 }}>No items</div>}
      {list.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {list.slice(0, 5).map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{b.title}</span>
                <span style={{ color: 'var(--color-text-subtle)', marginLeft: 6 }}>by {b.author || 'Unknown'}</span>
              </div>
              <span className="tag">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchBar value={query} onChange={setQuery} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn"
            aria-pressed={showOnlyFavorites}
            onClick={() => setShowOnlyFavorites(v => !v)}
            style={{ background: showOnlyFavorites ? 'var(--color-secondary)' : 'var(--color-muted)', color: showOnlyFavorites ? 'white' : 'var(--color-text)' }}
            title={showOnlyFavorites ? 'Showing favorites' : 'Show only favorites'}
          >
            {showOnlyFavorites ? '★ Favorites' : '☆ Favorites'}
          </button>
        </div>
      </div>

      {/* Reminders surface */}
      {!loading && !err && (
        <div className="grid" style={{ marginBottom: 16 }}>
          {reminderCard('Due Soon (next 3 days)', reminders.dueSoon, 'warn')}
          {reminderCard('Overdue', reminders.overdue, 'danger')}
        </div>
      )}

      {loading && <LoadingSkeleton count={8} />}

      {!loading && err && (
        <div className="empty" role="alert">
          Error loading books: {err}
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <EmptyState message={query ? `No results for "${query}"` : (showOnlyFavorites ? 'No favorite books yet.' : 'No books found.')} />
      )}

      {!loading && !err && filtered.length > 0 && (
        <BookGrid
          books={filtered}
          onOpen={(book) => setSelected(book)}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          averageRatings={averageRatings}
        />
      )}

      {selected && (
        <BookDetailsModal
          book={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
