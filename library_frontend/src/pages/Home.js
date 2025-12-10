import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BookGrid from '../components/BookGrid';
import BookDetailModal from '../components/BookDetailModal';
import { getBooks } from '../services/api';

// PUBLIC_INTERFACE
export default function Home() {
  /**
   * Home page: search input + grid of books with modal quick view.
   * Uses environment-driven API base with mock fallback.
   */
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getBooks()
      .then((data) => {
        if (!active) return;
        setBooks(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message || 'Failed to load books');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!query) return books;
    const q = query.toLowerCase();
    return books.filter((b) =>
      [b.title, b.author, b.isbn].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [books, query]);

  return (
    <section aria-label="Home">
      <div
        className="card"
        style={{
          background: 'var(--gradient-soft)',
          padding: 16,
          border: '1px solid rgba(37,99,235,0.15)',
          marginBottom: 16
        }}
      >
        <h1 style={{ margin: '4px 0 8px' }}>Explore the Library</h1>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>
          Search by title, author, or ISBN.
        </p>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => {}}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <p style={{ margin: 0 }}>Loading books…</p>
        </div>
      ) : error ? (
        <div className="card" role="alert" style={{ padding: 16, borderColor: 'var(--color-error)' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
        </div>
      ) : (
        <BookGrid books={filtered} onOpen={setSelected} />
      )}

      <BookDetailModal book={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
