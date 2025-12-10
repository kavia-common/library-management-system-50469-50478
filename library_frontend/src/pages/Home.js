import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BookGrid from '../components/BookGrid';
import { EmptyState, LoadingSkeleton } from '../components/States';
import BookDetailsModal from '../components/BookDetailsModal';
import { listBooks } from '../services/books';
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

  const onToggleFavorite = async (id) => {
    try {
      const next = await toggleFavorite(id);
      setFavoriteIds(next);
    } catch (e) {
      console.warn('Toggle favorite failed:', e.message);
    }
  };

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
