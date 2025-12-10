import React from 'react';

// PUBLIC_INTERFACE
export default function RatingStars({ value = 0, outOf = 5 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = outOf - full - half;

  return (
    <div className="stars" aria-label={`Rating ${value} out of ${outOf}`}>
      {'★'.repeat(full)}
      {half ? '☆' : ''}
      {'☆'.repeat(Math.max(0, empty - (half ? 1 : 0)))}
    </div>
  );
}
