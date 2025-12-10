import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function BookDetailModal({ book, onClose }) {
  /**
   * Accessible dialog/modal for book details.
   * Closes on ESC and backdrop click.
   */
  const { t, i18n } = useTranslation();
  const lng = i18n.language?.split('-')[0] || 'en';

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!book) return null;

  const title = typeof book.titleFor === 'function' ? book.titleFor(lng) : book.title;
  const description = typeof book.descriptionFor === 'function' ? book.descriptionFor(lng) : (book.description || '');
  const cover = book.coverUrl || `https://picsum.photos/seed/book-${book.id}/300/420`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-modal-title"
      onClick={(e) => { if (e.currentTarget === e.target) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)',
        display: 'grid', placeItems: 'center', padding: 16, zIndex: 100
      }}
    >
      <div className="card" style={{ maxWidth: 820, width: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <img
            src={cover}
            alt={t('card.coverAlt', { title })}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
              <h2 id="book-modal-title" style={{ margin: '8px 0 4px' }}>{title}</h2>
              <button className="btn" onClick={onClose} aria-label={t('modal.close')}>{t('modal.close')}</button>
            </div>
            <div style={{ color: 'var(--color-muted)', marginBottom: 8 }}>
              {book.author} • {book.year || t('card.unknown')}
            </div>
            <p style={{ marginTop: 8, lineHeight: 1.6 }}>
              {description || t('modal.noDescription')}
            </p>
            {book.tags?.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {book.tags.map((tTag) => (
                  <span key={tTag} style={{
                    fontSize: 12,
                    background: 'rgba(37,99,235,0.08)',
                    color: 'var(--color-primary)',
                    padding: '4px 10px',
                    borderRadius: 999
                  }}>{tTag}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
