import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BookGrid from '../components/BookGrid';
import BookDetailModal from '../components/BookDetailModal';
import { getBooks } from '../services/api';
import { useTranslation } from 'react-i18next';
import RecommendationsSection from '../components/RecommendationsSection';

// PUBLIC_INTERFACE
export default function Home() {
  /**
   * Home page: search input + grid of books with modal quick view.
   * Uses environment-driven API base with mock fallback.
   * Adds Recommendations below results: Trending (always) + Favorites-based (if any).
   */
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.split('-')[0] || 'en';

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
        setError(e?.message || t('home.error'));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [t]);

  const filtered = useMemo(() => {
    if (!query) return books;
    const q = query.toLowerCase();
    return books.filter((b) => {
      const title = typeof b.titleFor === 'function' ? b.titleFor(lng) : b.title;
      return [title, b.author, b.isbn].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [books, query, lng]);

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
        <h1 style={{ margin: '4px 0 8px' }}>{t('home.title')}</h1>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>
          {t('home.subtitle')}
        </p>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={() => {}}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <p style={{ margin: 0 }}>{t('home.loading')}</p>
        </div>
      ) : error ? (
        <div className="card" role="alert" style={{ padding: 16, borderColor: 'var(--color-error)' }}>
          <p style={{ color: 'var(--color-error)', margin: 0 }}>{error}</p>
        </div>
      ) : (
        <>
          <BookGrid books={filtered} onOpen={setSelected} />
          <div style={{ marginTop: 16 }}>
            <RecommendationsSection onOpen={setSelected} />
          </div>
        </>
      )}

      <BookDetailModal book={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
