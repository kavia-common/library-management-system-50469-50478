import React, { useEffect, useRef } from 'react';
import RatingStars from './RatingStars';
import Tag from './Tag';
import placeholder from '../assets/placeholder-book.svg';

// PUBLIC_INTERFACE
export default function BookDetailsModal({ book, onClose }) {
  const refPanel = useRef(null);
  const refFirst = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        // focus trap
        const focusable = refPanel.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => refFirst.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!book) return null;

  const imgSrc = book.cover || placeholder;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="book-details-title">
      <div className="modal-panel" ref={refPanel}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <strong id="book-details-title" style={{ fontSize: 18 }}>{book.title}</strong>
            <span style={{ color: 'var(--color-text-subtle)' }}>by {book.author}</span>
          </div>
          <button
            className="modal-close"
            aria-label="Close details"
            onClick={onClose}
            ref={refFirst}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16 }}>
            <img
              src={imgSrc}
              alt={book.title ? `Cover of ${book.title}` : 'Book cover'}
              width={160}
              height={220}
              style={{ width: 160, height: 220, objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--color-border)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <RatingStars value={book.rating || 0} />
                <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{book.rating?.toFixed?.(1) || '0.0'}</span>
                <span className="tag">{book.available ? 'Available' : 'Checked out'}</span>
              </div>
              <div className="tags" style={{ marginTop: 10 }}>
                {(book.genres || []).map((g, i) => <Tag key={i}>{g}</Tag>)}
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text)' }}>
                <div><strong>Year:</strong> {book.year || '—'}</div>
                <div><strong>ISBN:</strong> {book.isbn || '—'}</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, color: 'var(--color-text)' }}>
            <strong>Summary</strong>
            <p style={{ marginTop: 8, color: 'var(--color-text)' }}>
              {book.summary || 'No description provided.'}
            </p>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn" onClick={onClose}>Close</button>
            <button className="btn" style={{ background: 'var(--color-secondary)' }}>Add to List</button>
          </div>
        </div>
      </div>
    </div>
  );
}
