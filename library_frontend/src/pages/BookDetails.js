import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookById } from '../services/api';
import BookDetailModal from '../components/BookDetailModal';

// PUBLIC_INTERFACE
export default function BookDetails() {
  /**
   * Book details route page; loads by id and renders in-page details.
   * Also provides a Quick View modal and a back link.
   */
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    let active = true;
    setStatus({ loading: true, error: '' });
    getBookById(id)
      .then((b) => { if (active) setBook(b || null); })
      .catch((e) => { if (active) setStatus({ loading: false, error: e?.message || 'Failed to load' }); })
      .finally(() => { if (active) setStatus((s) => ({ ...s, loading: false })); });
    return () => { active = false; };
  }, [id]);

  if (status.loading) {
    return <div className="card" style={{ padding: 16 }}><p>Loading…</p></div>;
  }
  if (status.error) {
    return <div className="card" role="alert" style={{ padding: 16 }}><p style={{ color: 'var(--color-error)' }}>{status.error}</p></div>;
  }
  if (!book) {
    return <div className="card" style={{ padding: 16 }}><p>Book not found.</p></div>;
  }

  const cover = book.coverUrl || `https://picsum.photos/seed/book-${book.id}/300/420`;

  return (
    <section aria-label="Book details">
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <Link to="/" className="btn" aria-label="Back to home">← Back</Link>
        <button className="btn" onClick={() => setOpen(true)}>Quick view</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <img src={cover} alt={`Cover of ${book.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 8 }}>{book.title}</h1>
            <div style={{ color: 'var(--color-muted)' }}>{book.author} • {book.year || '—'}</div>
            <p style={{ marginTop: 12, lineHeight: 1.6 }}>{book.description || 'No description available.'}</p>
            {book.tags?.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {book.tags.map((t) => (
                  <span key={t} style={{
                    fontSize: 12,
                    background: 'rgba(37,99,235,0.08)',
                    color: 'var(--color-primary)',
                    padding: '4px 10px', borderRadius: 999
                  }}>{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <BookDetailModal book={open ? book : null} onClose={() => setOpen(false)} />
    </section>
  );
}
