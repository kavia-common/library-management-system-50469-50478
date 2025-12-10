import React from 'react';
import BookCard from './BookCard';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function BookGrid({ books, onOpen }) {
  /** Responsive grid of BookCard components. */
  const { t } = useTranslation();

  if (!books?.length) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>{t('home.empty')}</p>
      </div>
    );
  }

  return (
    <section
      aria-label={t('grid.aria')}
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
