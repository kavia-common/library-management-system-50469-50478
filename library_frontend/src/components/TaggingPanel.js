import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import getTaxonomyService from '../services/taxonomy';

/**
 * TaggingPanel allows viewing and editing tags/genres of a book.
 */

// PUBLIC_INTERFACE
export default function TaggingPanel({ bookId, canEdit }) {
  const { t } = useTranslation();
  const service = useMemo(() => getTaxonomyService, []);
  const [allTags, setAllTags] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
  const [assigned, setAssigned] = useState({ tags: [], genres: [] });
  const [tagQuery, setTagQuery] = useState('');
  const [genreQuery, setGenreQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [tgs, gnr, asg] = await Promise.all([
      service().getTags(),
      service().getGenres(),
      service().getBookTags(bookId),
    ]);
    setAllTags(tgs || []);
    setAllGenres(gnr || []);
    setAssigned(asg || { tags: [], genres: [] });
  };

  useEffect(() => {
    if (bookId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const filteredTags = (allTags || []).filter((t1) =>
    !tagQuery ? true : t1.name.toLowerCase().includes(tagQuery.trim().toLowerCase())
  );
  const filteredGenres = (allGenres || []).filter((g) =>
    !genreQuery ? true : g.name.toLowerCase().includes(genreQuery.trim().toLowerCase())
  );

  const toggle = (collection, id) => {
    const set = new Set(assigned[collection] || []);
    set.has(id) ? set.delete(id) : set.add(id);
    setAssigned((prev) => ({ ...prev, [collection]: Array.from(set) }));
  };

  const remove = (collection, id) => {
    setAssigned((prev) => ({ ...prev, [collection]: (prev[collection] || []).filter((x) => x !== id) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await service().assignTagsToBook(bookId, assigned);
    } finally {
      setSaving(false);
    }
  };

  const tagName = (id) => (allTags.find((t) => t.id === id)?.name || id);
  const genreName = (id) => (allGenres.find((g) => g.id === id)?.name || id);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 10px 30px rgba(37,99,235,0.08)',
      padding: 12
    }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <strong>{t('Assign to book')}</strong>
        {canEdit && <button className="btn primary" onClick={save} disabled={saving}>{saving ? t('Saving') : t('Save')}</button>}
      </div>

      <section aria-label="genres">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 80 }}>{t('Genres')}</span>
          {canEdit && <input className="input" placeholder={t('Search genres')} value={genreQuery} onChange={(e) => setGenreQuery(e.target.value)} />}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {(assigned.genres || []).map((id) => (
            <Chip key={id} label={genreName(id)} onRemove={canEdit ? () => remove('genres', id) : undefined} />
          ))}
        </div>
        {canEdit && (
          <div role="listbox" aria-label="genres-options" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {filteredGenres.map((g) => (
              <button
                key={g.id}
                className="btn secondary"
                onClick={() => toggle('genres', g.id)}
                aria-pressed={(assigned.genres || []).includes(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <hr style={{ border: 0, borderTop: '1px solid #f3f4f6', margin: '12px 0' }} />

      <section aria-label="tags">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ minWidth: 80 }}>{t('Tags')}</span>
          {canEdit && <input className="input" placeholder={t('Search tags')} value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} />}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {(assigned.tags || []).map((id) => (
            <Chip key={id} label={tagName(id)} onRemove={canEdit ? () => remove('tags', id) : undefined} />
          ))}
        </div>
        {canEdit && (
          <div role="listbox" aria-label="tags-options" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {filteredTags.map((tg) => (
              <button
                key={tg.id}
                className="btn secondary"
                onClick={() => toggle('tags', tg.id)}
                aria-pressed={(assigned.tags || []).includes(tg.id)}
              >
                {tg.name}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(37,99,235,0.08)', color: '#111827',
      borderRadius: 999, padding: '6px 10px'
    }}>
      <span>{label}</span>
      {onRemove && (
        <button
          className="icon-btn"
          aria-label={`remove ${label}`}
          onClick={onRemove}
          style={{ lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </span>
  );
}

TaggingPanel.propTypes = {
  bookId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  canEdit: PropTypes.bool,
};
