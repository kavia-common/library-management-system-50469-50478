import React, { useEffect, useRef, useState } from 'react';
import RatingStars from './RatingStars';
import Tag from './Tag';
import placeholder from '../assets/placeholder-book.svg';
import ReviewForm from './ReviewForm';
import { getReviews, addReview } from '../services/reviews';
import { getFavorites, toggleFavorite } from '../services/favorites';
import { borrowBook, returnBook } from '../services/books';

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
  const [working, setWorking] = useState(false);
  const [localBook, setLocalBook] = useState(book);
  // Borrow controls (must be declared at top-level, not conditionally)
  const [customDate, setCustomDate] = useState('');

  useEffect(() => { setLocalBook(book); }, [book]);

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
    if (!localBook) return;
    setLoadingReviews(true);
    setErr('');
    (async () => {
      try {
        const { reviews: list, average } = await getReviews(localBook.id);
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
  }, [localBook?.id]);

  if (!localBook) return null;

  const imgSrc = localBook.cover || placeholder;
  const isFav = favIds.includes(String(localBook.id));
  const borrowed = !!localBook.borrowed || (localBook.available === false);
  const due = localBook.dueDate ? new Date(localBook.dueDate) : null;

  const handleToggleFavorite = async () => {
    try {
      const next = await toggleFavorite(localBook.id);
      setFavIds(next);
    } catch (e) {
      console.warn('Toggle favorite failed:', e.message);
    }
  };

  const handleSubmitReview = async (data) => {
    if (!localBook) return;
    setSubmitting(true);
    setErr('');
    try {
      const { reviews: newList, average } = await addReview(localBook.id, data);
      setReviews(newList);
      setAvg(Number(average) || 0);
    } catch (e) {
      setErr(e.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const doBorrow = async (dueDate) => {
    if (!localBook || borrowed) return;
    setWorking(true);
    setErr('');
    // Optimistic
    const prev = localBook;
    setLocalBook({ ...prev, borrowed: true, available: false, dueDate });
    try {
      const updated = await borrowBook(localBook.id, { dueDate });
      setLocalBook(updated || { ...prev, borrowed: true, available: false, dueDate });
    } catch (e) {
      setErr(e.message || 'Failed to borrow');
      setLocalBook(prev);
    } finally {
      setWorking(false);
    }
  };

  const doReturn = async () => {
    if (!localBook || !borrowed) return;
    setWorking(true);
    setErr('');
    const prev = localBook;
    setLocalBook({ ...prev, borrowed: false, available: true, dueDate: null });
    try {
      const updated = await returnBook(localBook.id);
      setLocalBook(updated || { ...prev, borrowed: false, available: true, dueDate: null });
    } catch (e) {
      setErr(e.message || 'Failed to return');
      setLocalBook(prev);
    } finally {
      setWorking(false);
    }
  };

  // Borrow controls
  const todayIso = new Date().toISOString().slice(0,10);
  const quickPick = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="book-details-title">
      <div className="modal-panel" ref={refPanel}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <strong id="book-details-title" style={{ fontSize: 18 }}>{localBook.title}</strong>
            <span style={{ color: 'var(--color-text-subtle)' }}>by {localBook.author}</span>
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
              alt={localBook.title ? `Cover of ${localBook.title}` : 'Book cover'}
              width={160}
              height={220}
              style={{ width: 160, height: 220, objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--color-border)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <RatingStars value={avg || localBook.rating || 0} />
                <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{(avg || localBook.rating || 0).toFixed(1)}</span>
                <span className="tag" style={{ background: borrowed ? 'var(--color-error)' : 'var(--color-success)', color: '#fff' }}>
                  {borrowed ? 'Borrowed' : 'Available'}
                </span>
                {borrowed && localBook.dueDate && (
                  <span className="tag">Due {new Date(localBook.dueDate).toLocaleDateString()}</span>
                )}
              </div>
              <div className="tags" style={{ marginTop: 10 }}>
                {(localBook.genres || []).map((g, i) => <Tag key={i}>{g}</Tag>)}
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text)' }}>
                <div><strong>Year:</strong> {localBook.year || '—'}</div>
                <div><strong>ISBN:</strong> {localBook.isbn || '—'}</div>
              </div>

              {/* Borrow/Return actions */}
              <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                {!borrowed ? (
                  <>
                    <strong>Borrow this book</strong>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn" disabled={working} onClick={() => doBorrow(quickPick(7))}>Due in 1 week</button>
                      <button className="btn" disabled={working} onClick={() => doBorrow(quickPick(14))}>Due in 2 weeks</button>
                      <button className="btn" disabled={working} onClick={() => doBorrow(quickPick(30))}>Due in 30 days</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label className="label" htmlFor="due-date" style={{ margin: 0 }}>Pick due date</label>
                      <input
                        id="due-date"
                        type="date"
                        className="search-input"
                        min={todayIso}
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        style={{ maxWidth: 220 }}
                      />
                      <button
                        className="btn"
                        onClick={() => {
                          if (!customDate) return;
                          const dt = new Date(customDate);
                          if (Number.isNaN(dt.getTime())) return;
                          doBorrow(new Date(dt.setHours(23,59,59,999)).toISOString());
                        }}
                        disabled={working || !customDate}
                        aria-disabled={working || !customDate}
                      >
                        Borrow
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Return this book</strong>
                    <div>
                      <button className="btn" style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }} disabled={working} onClick={doReturn}>
                        {working ? 'Processing…' : 'Return'}
                      </button>
                    </div>
                  </>
                )}
                {err && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 12 }}>{err}</div>}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, color: 'var(--color-text)' }}>
            <strong>Summary</strong>
            <p style={{ marginTop: 8, color: 'var(--color-text)' }}>
              {localBook.summary || 'No description provided.'}
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
