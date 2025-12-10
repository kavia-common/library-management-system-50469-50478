import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BookGrid from '../components/BookGrid';
import { EmptyState, LoadingSkeleton } from '../components/States';
import BookDetailsModal from '../components/BookDetailsModal';
import { listBooks } from '../services/books';
import useNavigateToBook from '../hooks/useNavigateToBook';

// PUBLIC_INTERFACE
export default function Home() {
  const [query, setQuery] = useState('');
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState(null);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allBooks;
    return allBooks.filter(b => {
      const hay = [
        b.title,
        b.author,
        (b.genres || []).join(' ')
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [allBooks, query]);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {loading && <LoadingSkeleton count={8} />}

      {!loading && err && (
        <div className="empty" role="alert">
          Error loading books: {err}
        </div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <EmptyState message={query ? `No results for "${query}"` : 'No books found.'} />
      )}

      {!loading && !err && filtered.length > 0 && (
        <BookGrid books={filtered} onOpen={(book) => setSelected(book)} />
      )}

      {selected && (
        <BookDetailsModal
          book={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Also support navigation by clicking title action in future; for now, open modal via selection and enable deep linking via details page */}
    </div>
  );
}
