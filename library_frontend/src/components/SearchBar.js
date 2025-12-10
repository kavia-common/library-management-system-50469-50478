import React, { useId } from 'react';

// PUBLIC_INTERFACE
export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search books by title, author, or ISBN' }) {
  /** Accessible search bar with submit. */
  const inputId = useId();

  return (
    <form
      role="search"
      aria-label="Book search"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }}
      style={{ margin: '16px 0' }}
    >
      <label htmlFor={inputId} className="sr-only">Search books</label>
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 8,
          borderRadius: 12,
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <span aria-hidden="true" style={{ padding: '0 8px' }}>🔎</span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '10px 8px',
            fontSize: 16,
            background: 'transparent',
            color: 'var(--color-text)'
          }}
        />
        <button type="submit" className="btn">Search</button>
      </div>
    </form>
  );
}
