import React, { useState } from 'react';
import RatingStars from './RatingStars';

// PUBLIC_INTERFACE
export default function ReviewForm({ onSubmit, submitting }) {
  /**
   * Review form with rating (1-5) and text.
   */
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    if (!rating || rating < 1 || rating > 5) {
      setErr('Please select a rating between 1 and 5.');
      return;
    }
    if (!text.trim()) {
      setErr('Please enter your review text.');
      return;
    }
    onSubmit?.({ rating, text: text.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: 10 }}>
      <label className="label">Your Rating</label>
      <RatingStars value={rating} onChange={setRating} />
      <label className="label" htmlFor="review-text">Your Review</label>
      <textarea
        id="review-text"
        className="search-input"
        rows={4}
        placeholder="Share your thoughts about this book…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ resize: 'vertical' }}
      />
      {err && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 12 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Review'}</button>
      </div>
    </form>
  );
}
