import React from 'react';
import RatingStars from './RatingStars';
import Tag from './Tag';
import placeholder from '../assets/placeholder-book.svg';

/**
 * Props:
 * - book
 * - onOpen(book)
 * - favoriteIds?: array of favorited book ids
 * - onToggleFavorite?: (bookId) => void
 * - averageRating?: number override (from reviews aggregate)
 */
// PUBLIC_INTERFACE
export default function BookCard({ book, onOpen, favoriteIds = [], onToggleFavorite, averageRating }) {
  const imgSrc = book.cover || placeholder;
  const isFav = favoriteIds.includes(String(book.id));
  const ratingValue = typeof averageRating === 'number' ? averageRating : (book.rating || 0);

  const borrowed = !!book.borrowed || (book.available === false);
  const due = book.dueDate ? new Date(book.dueDate) : null;
  const dueText = due ? due.toLocaleDateString() : null;
  const badgeStyle = {
    background: borrowed ? 'var(--color-error)' : 'var(--color-success)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <article className="card" aria-labelledby={`title-${book.id}`}>
      <div style={{ position: 'relative' }}>
        <img
          className="card-media"
          src={imgSrc}
          alt={book.title ? `Cover of ${book.title}` : 'Book cover'}
          loading="lazy"
        />
        <button
          className="btn"
          aria-pressed={isFav}
          aria-label={isFav ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(book.id); }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: isFav ? 'var(--color-secondary)' : 'rgba(17,24,39,0.7)',
            padding: '6px 8px',
          }}
          title={isFav ? 'Favorited' : 'Add to favorites'}
        >
          {isFav ? '★' : '☆'}
        </button>

        <div style={{ position: 'absolute', left: 10, top: 10 }}>
          <span className="tag" style={badgeStyle}>
            {borrowed ? 'Borrowed' : 'Available'}
          </span>
        </div>
      </div>
      <div className="card-body" onClick={() => onOpen(book)} style={{ cursor: 'pointer' }}>
        <h3 className="card-title" id={`title-${book.id}`}>{book.title}</h3>
        <p className="card-author">by {book.author}</p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RatingStars value={ratingValue || 0} />
          <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
            {(ratingValue || 0).toFixed(1)}
          </span>
        </div>
        <div className="tags">
          {(book.genres || []).slice(0, 3).map((g, idx) => (
            <Tag key={idx}>{g}</Tag>
          ))}
          {borrowed && dueText && <Tag>Due {dueText}</Tag>}
        </div>
      </div>
      <div className="card-actions">
        <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
          {borrowed ? (dueText ? `Due ${dueText}` : 'Borrowed') : 'Available'}
        </span>
        <button
          className="btn"
          onClick={() => onOpen(book)}
          aria-label={`View details for ${book.title}`}
        >
          View
        </button>
      </div>
    </article>
  );
}
