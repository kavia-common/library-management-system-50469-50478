import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import BookGrid from '../components/BookGrid';
import BookDetailModal from '../components/BookDetailModal';
import { getBooks } from '../services/api';
import { useTranslation } from 'react-i18next';
import RecommendationsSection from '../components/RecommendationsSection';
import GamificationSummary from '../components/GamificationSummary';
import { getUserStats, listBadgesCatalog } from '../services/gamification';
import { useNavigate } from 'react-router-dom';
import FiltersBar from '../components/FiltersBar';

// PUBLIC_INTERFACE
export default function Home() {
  /**
   * Home page: search input + filters + grid of books with modal quick view.
   * Uses environment-driven API base with mock fallback.
   * Adds Recommendations below results: Trending (always) + Favorites-based (if any).
   */
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ tags: [], genres: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [gamStats, setGamStats] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const lng = i18n.language?.split('-')[0] || 'en';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getBooks(filters)
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
  }, [t, filters]);

  useEffect(() => {
    let active = true;
    getUserStats()
      .then((s) => {
        if (!active) return;
        setGamStats(s);
        const owned = new Set((s?.badges || []).map((b) => b.id));
        const catalog = listBadgesCatalog();
        setNextBadge(catalog.find((b) => !owned.has(b.id)) || null);
      })
      .catch(() => {});
    const onStorage = (e) => {
      if (e.key === 'gamification:userStats') {
        try {
          const s = JSON.parse(e.newValue || '{}');
          setGamStats(s);
          const owned = new Set((s?.badges || []).map((b) => b.id));
          const catalog = listBadgesCatalog();
          setNextBadge(catalog.find((b) => !owned.has(b.id)) || null);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { active = false; window.removeEventListener('storage', onStorage); };
  }, []);

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
        {gamStats ? (
          <div style={{ marginTop: 8, maxWidth: 420 }}>
            <GamificationSummary stats={gamStats} nextBadge={nextBadge} onClick={() => navigate('/gamification')} />
          </div>
        ) : null}
      </div>

      <FiltersBar value={filters} onChange={setFilters} />

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
