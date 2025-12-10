import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import RequirePermission from '../../components/auth/RequirePermission';
import StaffNav from '../../components/staff/StaffNav';
import getTaxonomyService from '../../services/taxonomy';
import TagFormModal from '../../components/TagFormModal';
import GenreFormModal from '../../components/GenreFormModal';

/**
 * Staff page to manage Genres and Tags
 */

// PUBLIC_INTERFACE
export default function StaffTaxonomy() {
  const { t } = useTranslation();
  const service = useMemo(() => getTaxonomyService, []);
  const [activeTab, setActiveTab] = useState('genres');
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [showTagModal, setShowTagModal] = useState(false);
  const [editTag, setEditTag] = useState(null);

  const [showGenreModal, setShowGenreModal] = useState(false);
  const [editGenre, setEditGenre] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'tag'|'genre', id, name }

  const refresh = async () => {
    setLoading(true);
    try {
      const [g, tgs] = await Promise.all([
        service().getGenres(query),
        service().getTags(query),
      ]);
      setGenres(g || []);
      setTags(tgs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSaveTag = async (payload) => {
    if (editTag) {
      await service().updateTag(editTag.id, payload);
    } else {
      await service().createTag(payload);
    }
    setShowTagModal(false);
    setEditTag(null);
    refresh();
  };

  const onSaveGenre = async (payload) => {
    if (editGenre) {
      await service().updateGenre(editGenre.id, payload);
    } else {
      await service().createGenre(payload);
    }
    setShowGenreModal(false);
    setEditGenre(null);
    refresh();
  };

  const onDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'tag') {
      await service().deleteTag(confirmDelete.id);
    } else {
      await service().deleteGenre(confirmDelete.id);
    }
    setConfirmDelete(null);
    refresh();
  };

  return (
    <RequirePermission permission="manage_inventory">
      <div className="page">
        <StaffNav />
        <div className="container" style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 12 }}>{t('Manage Tags')} / {t('Manage Genres')}</h2>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className={`btn ${activeTab === 'genres' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('genres')}
              aria-pressed={activeTab === 'genres'}
            >
              {t('Genres')}
            </button>
            <button
              className={`btn ${activeTab === 'tags' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('tags')}
              aria-pressed={activeTab === 'tags'}
            >
              {t('Tags')}
            </button>
            <input
              placeholder={activeTab === 'genres' ? t('Search genres') : t('Search tags')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('Search tags/genres')}
              className="input"
              style={{ flex: 1 }}
            />
            {activeTab === 'genres' ? (
              <button className="btn primary" onClick={() => { setEditGenre(null); setShowGenreModal(true); }}>
                {t('Add')}
              </button>
            ) : (
              <button className="btn primary" onClick={() => { setEditTag(null); setShowTagModal(true); }}>
                {t('Add')}
              </button>
            )}
          </div>

          {loading ? <div>{t('Loading')}...</div> : (
            <>
              {activeTab === 'genres' ? (
                <TaxonomyList
                  items={genres}
                  type="genre"
                  onEdit={(g) => { setEditGenre(g); setShowGenreModal(true); }}
                  onDelete={(g) => setConfirmDelete({ type: 'genre', id: g.id, name: g.name })}
                />
              ) : (
                <TaxonomyList
                  items={tags}
                  type="tag"
                  onEdit={(tg) => { setEditTag(tg); setShowTagModal(true); }}
                  onDelete={(tg) => setConfirmDelete({ type: 'tag', id: tg.id, name: tg.name })}
                />
              )}
            </>
          )}

          <TagFormModal
            isOpen={showTagModal}
            onClose={() => { setShowTagModal(false); setEditTag(null); }}
            onSave={onSaveTag}
            existingTags={tags}
            initial={editTag}
          />
          <GenreFormModal
            isOpen={showGenreModal}
            onClose={() => { setShowGenreModal(false); setEditGenre(null); }}
            onSave={onSaveGenre}
            existingGenres={genres}
            initial={editGenre}
          />

          {confirmDelete && (
            <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-del-title">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 id="confirm-del-title">{t('Delete')}</h3>
                  <button className="icon-btn" aria-label={t('Cancel')} onClick={() => setConfirmDelete(null)}>×</button>
                </div>
                <div className="modal-body">
                  <p>{t('confirm.delete', { name: confirmDelete.name })}</p>
                  <div className="modal-actions">
                    <button className="btn secondary" onClick={() => setConfirmDelete(null)}>{t('Cancel')}</button>
                    <button className="btn primary" onClick={onDelete}>{t('Delete')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequirePermission>
  );
}

function TaxonomyList({ items, onEdit, onDelete }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 10px 30px rgba(37,99,235,0.08)',
      padding: 12
    }}>
      <ul role="list" aria-label="taxonomy-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {(items || []).map((it) => (
          <li key={it.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 8px', borderBottom: '1px solid #f3f4f6'
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              {it.description ? <div style={{ fontSize: 12, color: '#6b7280' }}>{it.description}</div> : null}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn secondary" onClick={() => onEdit(it)} aria-label={`edit ${it.name}`}>Edit</button>
              <button className="btn secondary" onClick={() => onDelete(it)} aria-label={`delete ${it.name}`}>Delete</button>
            </div>
          </li>
        ))}
        {(items || []).length === 0 && (
          <li style={{ padding: 12, color: '#6b7280' }}>No items</li>
        )}
      </ul>
    </div>
  );
}
