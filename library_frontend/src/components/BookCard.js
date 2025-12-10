import React from 'react';
import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function BookCard({ book, onOpen }) {
  /**
   * Card representing a book.
   * Props:
   *  - book: { id, title, author, coverUrl, year, tags }
   *  - onOpen: function(book) -> open modal
   */
  const { id, title, author, coverUrl, year, tags = [] } = book;
  const cover = coverUrl || `https://picsum.photos/seed/book-${id}/300/420`;

  return (
    <article className="card" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <img
          src={cover}
          alt={`Cover of ${title}`}
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
          {year || '—'}
        </div>
      </div>
      <div style={{ padding: 12, display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3 }}>{title}</h3>
        <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>{author}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 3).map((t) => (
            <span key={t} style={{
              fontSize: 11,
              background: 'rgba(37,99,235,0.08)',
              color: 'var(--color-primary)',
              padding: '2px 8px', borderRadius: 999
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn" onClick={() => onOpen?.(book)} aria-label={`Quick view ${title}`}>
            Quick view
          </button>
          <Link to={`/books/${id}`} className="btn" aria-label={`Open details for ${title}`} style={{ background: 'var(--color-secondary)', color: '#111827' }}>
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
