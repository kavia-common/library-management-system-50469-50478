import React from 'react';
import RatingStars from './RatingStars';
import Tag from './Tag';
import placeholder from '../assets/placeholder-book.svg';

// PUBLIC_INTERFACE
export default function BookCard({ book, onOpen }) {
  const imgSrc = book.cover || placeholder;
  return (
    <article className="card" aria-labelledby={`title-${book.id}`}>
      <img
        className="card-media"
        src={imgSrc}
        alt={book.title ? `Cover of ${book.title}` : 'Book cover'}
        loading="lazy"
      />
      <div className="card-body">
        <h3 className="card-title" id={`title-${book.id}`}>{book.title}</h3>
        <p className="card-author">by {book.author}</p>
        <div style={{ marginTop: 8 }}>
          <RatingStars value={book.rating || 0} />
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
