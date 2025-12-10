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
        </div>
      </div>
      <div className="card-actions">
        <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
          {book.available ? 'Available' : 'Checked out'}
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
