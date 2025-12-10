import React from 'react';

/**
 * RatingStars
 * - Displays stars for a rating value.
 * - If onChange provided, becomes interactive (1..outOf selection).
 */
// PUBLIC_INTERFACE
export default function RatingStars({ value = 0, outOf = 5, onChange }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = outOf - full - half;

  if (!onChange) {
    return (
      <div className="stars" aria-label={`Rating ${value} out of ${outOf}`}>
        {'★'.repeat(full)}
        {half ? '☆' : ''}
        {'☆'.repeat(Math.max(0, empty - (half ? 1 : 0)))}
      </div>
    );
  }

  return (
    <div className="stars" role="radiogroup" aria-label={`Choose rating out of ${outOf}`} style={{ display: 'inline-flex', gap: 4 }}>
      {Array.from({ length: outOf }).map((_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={active}
            className="btn"
            onClick={() => onChange(n)}
            style={{
              padding: '2px 6px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: active ? '#F59E0B' : 'var(--color-text-subtle)',
              boxShadow: 'none',
            }}
            title={`${n} star${n > 1 ? 's' : ''}`}
          >
            {active ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}
