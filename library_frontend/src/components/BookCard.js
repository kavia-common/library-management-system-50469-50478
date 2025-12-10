import React, { useEffect, useState } from 'react';
import RatingStars from './RatingStars';
import Tag from './Tag';
import placeholder from '../assets/placeholder-book.svg';
import { getReadingLists, addToList, removeFromList } from '../services/user';

/**
 * Props:
 * - book
 * - onOpen(book)
 * - favoriteIds?: array of favorited book ids
 * - onToggleFavorite?: (bookId) => void
 * - averageRating?: number override (from reviews aggregate)
 */
// PUBLIC_INTERFACE
export default function BookCard({ book, onOpen, favoriteIds = [], onToggleFavorite, averageRating }) {
  const imgSrc = book.cover || placeholder;
  const isFav = favoriteIds.includes(String(book.id));
  const ratingValue = typeof averageRating === 'number' ? averageRating : (book.rating || 0);

  const borrowed = !!book.borrowed || (book.available === false);
  const due = book.dueDate ? new Date(book.dueDate) : null;
  const dueText = due ? due.toLocaleDateString() : null;
  const badgeStyle = {
    background: borrowed ? 'var(--color-error)' : 'var(--color-success)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    boxShadow: 'var(--shadow-sm)',
  };

  const [lists, setLists] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getReadingLists();
        if (alive) setLists(data.lists || []);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  const isInList = (l) => (l.bookIds || []).map(String).includes(String(book.id));

  const toggleList = async (l) => {
    if (working) return;
    setWorking(true);
    const prev = lists.slice();
    // optimistic
    setLists(cur => cur.map(x => x.id === l.id
      ? { ...x, bookIds: isInList(l) ? x.bookIds.filter(id => String(id) !== String(book.id)) : [String(book.id), ...x.bookIds] }
      : x));
    try {
      if (isInList(l)) {
        const data = await removeFromList(l.id, book.id);
        setLists(data.lists || []);
      } else {
        const data = await addToList(l.id, book.id);
        setLists(data.lists || []);
      }
    } catch (e) {
      console.warn('List update failed:', e.message);
      setLists(prev);
    } finally {
      setWorking(false);
    }
  };

  return (
    <article className="card" aria-labelledby={`title-${book.id}`}>
      <div style={{ position: 'relative' }}>
        <img
          className="card-media"
          src={imgSrc}
          alt={book.title ? `Cover of ${book.title}` : 'Book cover'}
          loading="lazy"
        />
        <button
          className="btn"
          aria-pressed={isFav}
          aria-label={isFav ? `Remove ${book.title} from favorites` : `Add ${book.title} to favorites`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(book.id); }}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: isFav ? 'var(--color-secondary)' : 'rgba(17,24,39,0.7)',
            padding: '6px 8px',
          }}
          title={isFav ? 'Favorited' : 'Add to favorites'}
        >
          {isFav ? '★' : '☆'}
        </button>

        <div style={{ position: 'absolute', left: 10, top: 10 }}>
          <span className="tag" style={badgeStyle}>
            {borrowed ? 'Borrowed' : 'Available'}
          </span>
        </div>
      </div>
      <div className="card-body" onClick={() => onOpen(book)} style={{ cursor: 'pointer' }}>
        <h3 className="card-title" id={`title-${book.id}`}>{book.title}</h3>
        <p className="card-author">by {book.author}</p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RatingStars value={ratingValue || 0} />
          <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
            {(ratingValue || 0).toFixed(1)}
          </span>
        </div>
        <div className="tags">
          {(book.genres || []).slice(0, 3).map((g, idx) => (
            <Tag key={idx}>{g}</Tag>
          ))}
          {borrowed && dueText && <Tag>Due {dueText}</Tag>}
        </div>
      </div>
      <div className="card-actions">
        <span style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
          {borrowed ? (dueText ? `Due ${dueText}` : 'Borrowed') : 'Available'}
        </span>
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          <button
            className="btn"
            onClick={() => setShowMenu(v => !v)}
            aria-haspopup="menu"
            aria-expanded={showMenu}
            title="Add/Remove in Reading Lists"
          >
            Lists ▾
          </button>
          <button
            className="btn"
            onClick={() => onOpen(book)}
            aria-label={`View details for ${book.title}`}
          >
            View
          </button>
          {showMenu && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                padding: 8,
                minWidth: 220,
                zIndex: 10,
              }}
            >
              {lists.length === 0 && <div className="empty" style={{ padding: 8 }}>No lists</div>}
              {lists.map(l => {
                const active = (l.bookIds || []).map(String).includes(String(book.id));
                return (
                  <button
                    key={l.id}
                    className="btn"
                    role="menuitemcheckbox"
                    aria-checked={active}
                    onClick={(e) => { e.stopPropagation(); toggleList(l); }}
                    style={{
                      width: '100%',
                      marginBottom: 6,
                      background: active ? 'var(--color-secondary)' : 'var(--color-muted)',
                      color: active ? 'white' : 'var(--color-text)',
                    }}
                    disabled={working}
                  >
                    {active ? '✓ ' : ''}{l.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
