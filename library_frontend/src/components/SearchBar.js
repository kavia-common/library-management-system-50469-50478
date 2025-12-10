import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';

// PUBLIC_INTERFACE
export default function SearchBar({ value, onChange, onSubmit, placeholder }) {
  /** Accessible search bar with submit. */
  const inputId = useId();
  const { t } = useTranslation();
  const ph = placeholder || t('search.placeholder');

  return (
    <form
      role="search"
      aria-label={t('search.label')}
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }}
      style={{ margin: '16px 0' }}
    >
      <label htmlFor={inputId} className="sr-only">{t('search.label')}</label>
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
          placeholder={ph}
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
        <button type="submit" className="btn">{t('search.button')}</button>
      </div>
    </form>
  );
}
