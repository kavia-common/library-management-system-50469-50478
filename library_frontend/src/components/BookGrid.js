import React from 'react';
import BookCard from './BookCard';

// PUBLIC_INTERFACE
export default function BookGrid({ books, onOpen }) {
  return (
    <div className="grid" role="list" aria-label="Books">
      {books.map((b) => (
        <div key={b.id} role="listitem">
          <BookCard book={b} onOpen={onOpen} />
        </div>
      ))}
    </div>
  );
}
