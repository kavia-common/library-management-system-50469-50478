import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import RecommendationCard from './RecommendationCard';

// PUBLIC_INTERFACE
export default function RecommendationRow({
  title,
  subtitle,
  books = [],
  loading = false,
  emptyMessage,
  onOpen,
  favorites = [],
  onToggleFavorite
}) {
  /**
   * Horizontally scrollable row of RecommendationCard with keyboard navigation.
   */
  const { t } = useTranslation();
  const listRef = useRef(null);

  const isReduced = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollBy = (delta) => {
    const el = listRef.current;
    if (!el) return;
    if (isReduced) {
      el.scrollLeft += delta;
    } else {
      el.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(260);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollBy(-260);
    }
  };

  return (
    <section aria-label={title} className="card" style={{ padding: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 8, padding: '4px 4px 8px' }}>
        <div>
          <h2 style={{ margin: '4px 0' }}>{title}</h2>
          {subtitle ? <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>{subtitle}</div> : null}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => scrollBy(-320)} aria-label={t('recs.scrollLeft')} title={t('recs.scrollLeft')}>←</button>
          <button className="btn" onClick={() => scrollBy(320)} aria-label={t('recs.scrollRight')} title={t('recs.scrollRight')}>→</button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <p style={{ margin: 0 }}>{t('recs.loading')}</p>
        </div>
      ) : !books?.length ? (
        <div className="card" style={{ padding: 16 }}>
          <p style={{ margin: 0, color: 'var(--color-muted)' }}>{emptyMessage || t('recs.empty')}</p>
        </div>
      ) : (
        <div
          ref={listRef}
          role="listbox"
          aria-label={title}
          tabIndex={0}
          onKeyDown={onKeyDown}
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 12,
            padding: 8,
            scrollSnapType: 'x mandatory'
          }}
        >
          {books.map((b) => (
            <div key={b.id} style={{ scrollSnapAlign: 'start' }}>
              <RecommendationCard
                book={b}
                onOpen={onOpen}
                isFavorite={favorites.includes(String(b.id))}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
