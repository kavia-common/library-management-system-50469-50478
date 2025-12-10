import React from 'react';
import BookCard from './BookCard';

// PUBLIC_INTERFACE
export default function BookGrid({ books, onOpen }) {
  /** Responsive grid of BookCard components. */
  if (!books?.length) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>No books found.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Book results"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16
      }}
    >
      {books.map((b) => (
        <BookCard key={b.id} book={b} onOpen={onOpen} />
      ))}
    </section>
  );
}
