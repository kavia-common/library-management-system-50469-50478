import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBookById, getUsersAlsoBorrowed, readFavorites, toggleFavorite } from '../services/api';
import BookDetailModal from '../components/BookDetailModal';
import { useTranslation } from 'react-i18next';
import RecommendationRow from '../components/RecommendationRow';
import { recordReadingActivity } from '../services/gamification';
import { useToast } from '../components/ToastContext';
import { getEvents } from '../services/events';
import TaggingPanel from '../components/TaggingPanel';
import { AuthContext } from '../context/AuthContext';

// PUBLIC_INTERFACE
export default function BookDetails() {
  /**
   * Book details route page; loads by id and renders in-page details.
   * Shows "Users also borrowed" and contextual banner if book club meeting references this book.
   * Integrates TaggingPanel with permission-aware editing.
   */
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ loading: true, error: '' });
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const lng = i18n.language?.split('-')[0] || 'en';

  const [also, setAlso] = useState({ loading: true, items: [] });
  const [favorites, setFavorites] = useState(readFavorites());
  const [relatedEvent, setRelatedEvent] = useState(null);
  const { user } = useContext(AuthContext) || {};
  const canEdit = !!(user?.permissions?.includes?.('manage_inventory')) || !process.env.REACT_APP_API_BASE;

  useEffect(() => {
    let active = true;
    setStatus({ loading: true, error: '' });
    getBookById(id)
      .then((b) => { if (active) setBook(b || null); })
      .catch((e) => { if (active) setStatus({ loading: false, error: e?.message || t('home.error') }); })
      .finally(() => { if (active) setStatus((s) => ({ ...s, loading: false })); });
    return () => { active = false; };
  }, [id, t]);

  useEffect(() => {
    let active = true;
    setAlso((s) => ({ ...s, loading: true }));
    getUsersAlsoBorrowed(id)
      .then((items) => { if (active) setAlso({ loading: false, items: items || [] }); })
      .catch(() => { if (active) setAlso({ loading: false, items: [] }); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'favorites') setFavorites(readFavorites());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchRelated() {
      if (!book?.isbn) return;
      const events = await getEvents({ category: 'book_club' });
      const match = events.find((e) => e.referencedBookIsbn === book.isbn);
      if (mounted) setRelatedEvent(match || null);
    }
    fetchRelated();
    return () => { mounted = false; };
  }, [book]);

  if (status.loading) {
    return <div className="card" style={{ padding: 16 }}><p>{t('details.loading')}</p></div>;
  }
  if (status.error) {
    return <div className="card" role="alert" style={{ padding: 16 }}><p style={{ color: 'var(--color-error)' }}>{status.error}</p></div>;
  }
  if (!book) {
    return <div className="card" style={{ padding: 16 }}><p>{t('details.notFound')}</p></div>;
  }

  const title = typeof book.titleFor === 'function' ? book.titleFor(lng) : book.title;
  const description = typeof book.descriptionFor === 'function' ? book.descriptionFor(lng) : (book.description || '');
  const cover = book.coverUrl || `https://picsum.photos/seed/book-${book.id}/300/420`;

  const onToggleFavorite = (bookId) => {
    const next = toggleFavorite(bookId);
    setFavorites(next);
  };

  return (
    <section aria-label="Book details">
      {relatedEvent && (
        <div className="info-banner" style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', padding:8, borderRadius:8, marginBottom:8 }}>
          📚 Book club meeting scheduled: <strong>{relatedEvent.title}</strong> on {new Date(relatedEvent.start).toLocaleString()} — <Link to="/events">View</Link>
        </div>
      )}

      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to="/" className="btn" aria-label={t('details.back')}>{t('details.back')}</Link>
        <button className="btn" onClick={() => setOpen(true)}>{t('details.quickView')}</button>
        <button
          className="btn"
          onClick={async () => {
            const res = await recordReadingActivity({ pages: 5, minutes: 10 });
            if (res?._newBadges?.length) {
              showToast(t('gam.toasts.badgeEarned', { name: t(res._newBadges[0].nameKey) }));
            } else {
              showToast(t('gam.toasts.activityRecorded'));
            }
          }}
          aria-label={t('gam.actions.logReading')}
          title={t('gam.actions.logReading')}
          style={{ background: 'var(--color-secondary)', color: '#111827' }}
        >
          {t('gam.actions.logReading')}
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <img src={cover} alt={t('details.coverAlt', { title })} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ padding: 16 }}>
            <h1 style={{ marginTop: 8 }}>{title}</h1>
            <div style={{ color: 'var(--color-muted)' }}>{book.author} • {book.year || '—'}</div>
            <p style={{ marginTop: 12, lineHeight: 1.6 }}>{description || t('details.noDescription')}</p>
            {book.tags?.length ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {book.tags.map((tTag) => (
                  <span key={tTag} style={{
                    fontSize: 12,
                    background: 'rgba(37,99,235,0.08)',
                    color: 'var(--color-primary)',
                    padding: '4px 10px', borderRadius: 999
                  }}>{tTag}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <TaggingPanel bookId={book.id} canEdit={canEdit} />
      </div>

      <div style={{ marginTop: 16 }}>
        <RecommendationRow
          title={t('recs.alsoBorrowedTitle')}
          subtitle={t('recs.alsoBorrowedSubtitle')}
          books={also.items}
          loading={also.loading}
          onOpen={() => setOpen(true)}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      </div>

      <BookDetailModal book={open ? book : null} onClose={() => setOpen(false)} />
    </section>
  );
}
