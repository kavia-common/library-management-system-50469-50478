import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function BookCard({ book, onOpen }) {
  /**
   * Card representing a book.
   * Props:
   *  - book: localized book object with titleFor(lng), descriptionFor(lng)
   *  - onOpen: function(book) -> open modal
   */
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.split('-')[0] || 'en';

  const { id, author, coverUrl, year, tags = [] } = book;
  const title = typeof book.titleFor === 'function' ? book.titleFor(lng) : book.title;
  const cover = coverUrl || `https://picsum.photos/seed/book-${id}/300/420`;

  return (
    <article className="card" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={cover}
          alt={t('card.coverAlt', { title })}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
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
      <div style={{ padding: 12, display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3 }}>{title}</h3>
        <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>{author}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map((tTag) => (
            <span key={tTag} style={{
              fontSize: 11,
              background: 'rgba(37,99,235,0.08)',
              color: 'var(--color-primary)',
              padding: '2px 8px', borderRadius: 999
            }}>{tTag}</span>
          ))}
        </div>
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
