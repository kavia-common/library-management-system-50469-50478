import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function RecommendationCard({ book, onOpen, isFavorite, onToggleFavorite }) {
  /**
   * Card for a recommended book. Mirrors BookCard styling and actions, plus a favorite toggle.
   */
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.split('-')[0] || 'en';

  const { id, author, coverUrl, year, tags = [] } = book || {};
  const title = typeof book?.titleFor === 'function' ? book.titleFor(lng) : book?.title;
  const cover = coverUrl || `https://picsum.photos/seed/book-${id}/300/420`;

  const favLabel = isFavorite ? t('recs.removeFavorite') : t('recs.addFavorite');

  return (
    <article className="card" style={{ overflow: 'hidden', width: 200, flex: '0 0 auto' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={cover}
          alt={t('card.coverAlt', { title })}
          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => onToggleFavorite?.(id)}
          aria-pressed={!!isFavorite}
          aria-label={favLabel}
          title={favLabel}
          className="card"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'var(--color-surface)',
            border: '1px solid rgba(17,24,39,0.1)',
            borderRadius: 999,
            width: 36, height: 36,
            display: 'grid', placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span aria-hidden="true">{isFavorite ? '❤️' : '🤍'}</span>
        </button>
        <div style={{
          position: 'absolute',
          bottom: 8, left: 8,
          background: 'rgba(17,24,39,0.7)',
          color: '#fff',
          padding: '2px 8px',
          borderRadius: 8,
          fontSize: 12
        }}>
          {year || t('card.unknown')}
        </div>
      </div>
      <div style={{ padding: 10, display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.3 }}>{title}</h3>
        <div style={{ color: 'var(--color-muted)', fontSize: 13 }}>{author}</div>
        {tags?.length ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.slice(0, 2).map((tg) => (
              <span key={tg} style={{
                fontSize: 10,
                background: 'rgba(37,99,235,0.08)',
                color: 'var(--color-primary)',
                padding: '2px 6px', borderRadius: 999
              }}>{tg}</span>
            ))}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn" onClick={() => onOpen?.(book)} aria-label={t('card.ariaQuickView', { title })}>
            {t('card.quickView')}
          </button>
          <Link to={`/books/${id}`} className="btn" aria-label={t('card.ariaDetails', { title })} style={{ background: 'var(--color-secondary)', color: '#111827' }}>
            {t('card.details')}
          </Link>
        </div>
      </div>
    </article>
  );
}
