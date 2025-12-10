import React, { useEffect, useMemo, useState } from 'react';
import getTaxonomyService from '../services/taxonomy';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

/**
 * FiltersBar provides multi-select filtering by tags and genres
 */

// PUBLIC_INTERFACE
export default function FiltersBar({ value, onChange }) {
  const { t } = useTranslation();
  const service = useMemo(() => getTaxonomyService, []);
  const [tags, setTags] = useState([]);
  const [genres, setGenres] = useState([]);
  const [tagQ, setTagQ] = useState('');
  const [genreQ, setGenreQ] = useState('');

  useEffect(() => {
    async function load() {
      const [tgs, gnr] = await Promise.all([service().getTags(), service().getGenres()]);
      setTags(tgs || []);
      setGenres(gnr || []);
    }
    load();
  }, [service]);

  const toggle = (type, id) => {
    const set = new Set(value?.[type] || []);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange({ ...value, [type]: Array.from(set) });
  };

  const clearAll = () => onChange({ tags: [], genres: [] });

  const tagName = (id) => tags.find((t) => t.id === id)?.name || id;
  const genreName = (id) => genres.find((g) => g.id === id)?.name || id;

  const filteredTags = tags.filter((t1) => !tagQ || t1.name.toLowerCase().includes(tagQ.trim().toLowerCase()));
  const filteredGenres = genres.filter((g) => !genreQ || g.name.toLowerCase().includes(genreQ.trim().toLowerCase()));

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 10px 30px rgba(37,99,235,0.08)',
      padding: 12,
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>{t('Filters')}</strong>
        <button className="btn secondary" onClick={clearAll}>{t('Clear all')}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ marginBottom: 6 }}>{t('Genres')}</div>
          <input className="input" placeholder={t('Search genres')} value={genreQ} onChange={(e) => setGenreQ(e.target.value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {(value.genres || []).map((id) => (
              <Chip key={id} label={genreName(id)} onRemove={() => toggle('genres', id)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {filteredGenres.map((g) => (
              <button
                key={g.id}
                className="btn secondary"
                onClick={() => toggle('genres', g.id)}
                aria-pressed={(value.genres || []).includes(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 6 }}>{t('Tags')}</div>
          <input className="input" placeholder={t('Search tags')} value={tagQ} onChange={(e) => setTagQ(e.target.value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {(value.tags || []).map((id) => (
              <Chip key={id} label={tagName(id)} onRemove={() => toggle('tags', id)} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {filteredTags.map((tg) => (
              <button
                key={tg.id}
                className="btn secondary"
                onClick={() => toggle('tags', tg.id)}
                aria-pressed={(value.tags || []).includes(tg.id)}
              >
                {tg.name}
              </button>
            ))}
          </div>
        </div>
      </div>
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
      <button className="icon-btn" aria-label={`remove ${label}`} onClick={onRemove}>×</button>
    </span>
  );
}

FiltersBar.propTypes = {
  value: PropTypes.shape({
    tags: PropTypes.array,
    genres: PropTypes.array,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
