import React from 'react';

// PUBLIC_INTERFACE
export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-wrap" role="search">
      <span className="search-icon" aria-hidden>🔎</span>
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title, author, or genre..."
        aria-label="Search books"
      />
    </div>
  );
}
