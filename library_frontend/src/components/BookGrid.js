import React from 'react';
import BookCard from './BookCard';

/**
 * Props:
 * - books
 * - onOpen(book)
 * - favoriteIds?: array
 * - onToggleFavorite?: (id) => void
 * - averageRatings?: Record<bookId, number>
 */
// PUBLIC_INTERFACE
export default function BookGrid({ books, onOpen, favoriteIds = [], onToggleFavorite, averageRatings = {} }) {
  return (
    <div className="grid" role="list" aria-label="Books">
      {books.map((b) => (
        <div key={b.id} role="listitem">
          <BookCard
            book={b}
            onOpen={onOpen}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            averageRating={averageRatings[String(b.id)]}
          />
        </div>
      ))}
    </div>
  );
}
