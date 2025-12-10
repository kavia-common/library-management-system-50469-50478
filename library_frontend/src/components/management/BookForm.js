import React, { useEffect, useRef, useState } from 'react';

// PUBLIC_INTERFACE
export default function BookForm({ initialValues, onSubmit, onCancel, loading }) {
  /**
   * Accessible, client-validated form for book details
   * Fields: title, author, genre, year
   * - 'genre' maps to a single genre string; service will normalize to array
   */
  const [values, setValues] = useState({
    title: initialValues?.title || '',
    author: initialValues?.author || '',
    genre: Array.isArray(initialValues?.genres) ? (initialValues.genres[0] || '') : (initialValues?.genre || ''),
    year: initialValues?.year ?? '',
  });
  const [errors, setErrors] = useState({});
  const firstFieldRef = useRef(null);

  useEffect(() => {
    setValues({
      title: initialValues?.title || '',
      author: initialValues?.author || '',
      genre: Array.isArray(initialValues?.genres) ? (initialValues.genres[0] || '') : (initialValues?.genre || ''),
      year: initialValues?.year ?? '',
    });
  }, [initialValues]);

  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  const validate = (v) => {
    const errs = {};
    if (!v.title.trim()) errs.title = 'Title is required';
    if (!v.author.trim()) errs.author = 'Author is required';
    if (v.year !== '' && !/^\d{4}$/.test(String(v.year))) errs.year = 'Year must be 4 digits';
    return errs;
  };

  const handleChange = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    setErrors(validate(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const payload = {
      title: values.title.trim(),
      author: values.author.trim(),
      genre: values.genre.trim(),
      year: values.year === '' ? undefined : Number(values.year),
    };
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label htmlFor="title" className="label">Title</label>
          <input
            id="title"
            name="title"
            ref={firstFieldRef}
            className="search-input"
            value={values.title}
            onChange={handleChange('title')}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
            placeholder="e.g., The Pragmatic Programmer"
          />
          {errors.title && <div id="title-error" role="alert" style={errorStyle}>{errors.title}</div>}
        </div>

        <div>
          <label htmlFor="author" className="label">Author</label>
          <input
            id="author"
            name="author"
            className="search-input"
            value={values.author}
            onChange={handleChange('author')}
            aria-invalid={!!errors.author}
            aria-describedby={errors.author ? 'author-error' : undefined}
            placeholder="e.g., Andrew Hunt"
          />
          {errors.author && <div id="author-error" role="alert" style={errorStyle}>{errors.author}</div>}
        </div>

        <div>
          <label htmlFor="genre" className="label">Genre</label>
          <input
            id="genre"
            name="genre"
            className="search-input"
            value={values.genre}
            onChange={handleChange('genre')}
            placeholder="e.g., Technology"
          />
        </div>

        <div>
          <label htmlFor="year" className="label">Year</label>
          <input
            id="year"
            name="year"
            className="search-input"
            inputMode="numeric"
            pattern="[0-9]*"
            value={values.year}
            onChange={handleChange('year')}
            aria-invalid={!!errors.year}
            aria-describedby={errors.year ? 'year-error' : undefined}
            placeholder="e.g., 1999"
          />
          {errors.year && <div id="year-error" role="alert" style={errorStyle}>{errors.year}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button type="button" className="btn" style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }} onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

const errorStyle = {
  color: 'var(--color-error)',
  fontSize: 12,
  marginTop: 6,
};
