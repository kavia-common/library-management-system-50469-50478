import React, { useEffect, useRef, useState } from 'react';
import RatingStars from './RatingStars';
import Tag from './Tag';
import placeholder from '../assets/placeholder-book.svg';
import ReviewForm from './ReviewForm';
import { getReviews, addReview } from '../services/reviews';
import { getFavorites, toggleFavorite } from '../services/favorites';

// PUBLIC_INTERFACE
export default function BookDetailsModal({ book, onClose }) {
  const refPanel = useRef(null);
  const refFirst = useRef(null);
  const [favIds, setFavIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const favs = await getFavorites();
        if (alive) setFavIds(favs);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!book) return;
    setLoadingReviews(true);
    setErr('');
    (async () => {
      try {
        const { reviews: list, average } = await getReviews(book.id);
        if (alive) {
          setReviews(Array.isArray(list) ? list : []);
          setAvg(Number(average) || 0);
        }
      } catch (e) {
        if (alive) setErr(e.message || 'Failed to load reviews');
      } finally {
        if (alive) setLoadingReviews(false);
      }
    })();
    return () => { alive = false; };
  }, [book?.id]);

  if (!book) return null;

  const imgSrc = book.cover || placeholder;
  const isFav = favIds.includes(String(book.id));

  const handleToggleFavorite = async () => {
    try {
      const next = await toggleFavorite(book.id);
      setFavIds(next);
    } catch (e) {
      console.warn('Toggle favorite failed:', e.message);
    }
  };

  const handleSubmitReview = async (data) => {
    if (!book) return;
    setSubmitting(true);
    setErr('');
    try {
      const { reviews: newList, average } = await addReview(book.id, data);
      setReviews(newList);
      setAvg(Number(average) || 0);
    } catch (e) {
      setErr(e.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="book-details-title">
      <div className="modal-panel" ref={refPanel}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <strong id="book-details-title" style={{ fontSize: 18 }}>{book.title}</strong>
            <span style={{ color: 'var(--color-text-subtle)' }}>by {book.author}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn"
              aria-pressed={isFav}
              onClick={handleToggleFavorite}
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              style={{ background: isFav ? 'var(--color-secondary)' : 'var(--color-primary)' }}
              ref={refFirst}
            >
              {isFav ? '★ Favorited' : '☆ Favorite'}
            </button>
            <button
              className="modal-close"
              aria-label="Close details"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
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
                <RatingStars value={avg || book.rating || 0} />
                <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{(avg || book.rating || 0).toFixed(1)}</span>
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

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>Reviews</strong>
              <span style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>
                Average {(avg || 0).toFixed(1)}
              </span>
            </div>
            {loadingReviews && <div className="empty" role="status">Loading reviews…</div>}
            {!loadingReviews && err && <div className="empty" role="alert">{err}</div>}
            {!loadingReviews && !err && (
              <>
                {reviews.length === 0 && <div className="empty">No reviews yet.</div>}
                {reviews.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {reviews.map((r, i) => (
                      <div key={r.id || i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: 12, background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RatingStars value={Number(r.rating) || 0} />
                            <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{Number(r.rating) || 0}/5</span>
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{new Date(r.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                        <p style={{ marginTop: 8 }}>{r.text}</p>
                        <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{r.user || 'Anonymous'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <strong>Add a Review</strong>
            <div style={{ marginTop: 8 }}>
              <ReviewForm onSubmit={handleSubmitReview} submitting={submitting} />
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
