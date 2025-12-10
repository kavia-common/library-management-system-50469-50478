import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookDetailsModal from '../components/BookDetailsModal';
import { getBook } from '../services/books';

// PUBLIC_INTERFACE
export default function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const b = await getBook(id);
        if (alive) setBook(b);
        if (alive && !b) setErr('Book not found');
      } catch (e) {
        if (alive) setErr(e.message || 'Failed to load book');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return <div className="container" style={{ paddingTop: 20 }}><div className="empty">Loading details…</div></div>;
  }

  if (err) {
    return <div className="container" style={{ paddingTop: 20 }}><div className="empty" role="alert">{err}</div></div>;
  }

  if (!book) {
    return <div className="container" style={{ paddingTop: 20 }}><div className="empty">Book not found.</div></div>;
  }

  return (
    <>
      <div className="container" style={{ paddingTop: 20 }}>
        {/* Show a compact inline details as well for non-modal view */}
        <div style={{ display: 'grid', gap: 16 }}>
          <button className="btn" onClick={() => navigate(-1)} aria-label="Go back">← Back</button>
        </div>
      </div>
      <BookDetailsModal book={book} onClose={() => navigate('/')} />
    </>
  );
}
