import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './tagModal.css';
import { useTranslation } from 'react-i18next';

/**
 * Modal for Genre creation and editing with validation.
 */

// PUBLIC_INTERFACE
export default function GenreFormModal({ isOpen, onClose, onSave, existingGenres, initial }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [color, setColor] = useState(initial?.color || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name || '');
      setDescription(initial?.description || '');
      setColor(initial?.color || '');
      setError('');
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const onSubmit = (e) => {
    e.preventDefault();
    const nm = name.trim();
    if (!nm) {
      setError(t('validation.required'));
      return;
    }
    const duplicate = (existingGenres || []).some(
      (g) => g.id !== initial?.id && g.name.toLowerCase() === nm.toLowerCase()
    );
    if (duplicate) {
      setError(t('validation.unique'));
      return;
    }
    onSave({ name: nm, description: description || '', color: color || '' });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="genre-modal-title">
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="genre-modal-title">{initial ? t('Edit') : t('Add')} {t('Genres')}</h3>
          <button className="icon-btn" aria-label={t('Cancel')} onClick={onClose}>×</button>
        </div>
        <form onSubmit={onSubmit} className="modal-body">
          <label className="field">
            <span className="label">{t('Name')}</span>
            <input
              aria-label={t('Name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </label>
          <label className="field">
            <span className="label">{t('Description')}</span>
            <input
              aria-label={t('Description')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
            />
          </label>
          <label className="field">
            <span className="label">{t('Color')}</span>
            <input
              aria-label={t('Color')}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="input"
              placeholder="#2563EB"
            />
          </label>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>{t('Cancel')}</button>
            <button type="submit" className="btn primary">{t('Save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

GenreFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  existingGenres: PropTypes.array,
  initial: PropTypes.object,
};
