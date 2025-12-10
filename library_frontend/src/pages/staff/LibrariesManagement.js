import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StaffNav from '../../components/staff/StaffNav';
import { createLibrary, deleteLibrary, getLibraries, updateLibrary } from '../../services/staff';
import RequirePermission from '../../components/auth/RequirePermission';

function LibraryModal({ open, onClose, initial, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [hours, setHours] = useState(initial?.hours || '');

  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setAddress(initial?.address || '');
      setHours(initial?.hours || '');
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave({ name, address, hours });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={initial ? t('staff.libraries.editTitle') : t('staff.libraries.addTitle')}
         className="card" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={submit} className="card" style={{ background: 'var(--color-surface)', padding: 16, minWidth: 320, maxWidth: '90%', borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>{initial ? t('staff.libraries.editTitle') : t('staff.libraries.addTitle')}</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            <div>{t('staff.libraries.fields.name')}</div>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="card" style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            <div>{t('staff.libraries.fields.address')}</div>
            <input value={address} onChange={(e) => setAddress(e.target.value)} required className="card" style={{ width: '100%', padding: 8 }} />
          </label>
          <label>
            <div>{t('staff.libraries.fields.hours')}</div>
            <input value={hours} onChange={(e) => setHours(e.target.value)} required className="card" style={{ width: '100%', padding: 8 }} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>{t('notifications.actions.cancel')}</button>
          <button type="submit" className="btn">{t('notifications.actions.save')}</button>
        </div>
      </form>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function LibrariesManagement() {
  /** Manage libraries with CRUD, search, and pagination. */
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / pageSize)), [data.total, pageSize]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await getLibraries({ query, page, pageSize });
      setData(res);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, pageSize]);
  useEffect(() => { const id = setTimeout(() => { setPage(1); load(); }, 200); return () => clearTimeout(id); /* eslint-disable-next-line */ }, [query]);

  const onAdd = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (item) => { setEditing(item); setModalOpen(true); };

  const onSave = async (values) => {
    if (editing) {
      await updateLibrary(editing.id, values);
    } else {
      await createLibrary(values);
    }
    setModalOpen(false);
    await load();
  };

  const onDelete = async (id) => {
    if (!window.confirm(t('staff.libraries.confirmDelete'))) return;
    await deleteLibrary(id);
    await load();
  };

  return (
    <RequirePermission permission="manage_libraries" fallback={<div className="card" style={{ padding: 16 }}>{t('staff.forbidden')}</div>}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <StaffNav />
        <div style={{ flex: 1, padding: 12 }}>
          <h1 style={{ marginTop: 0 }}>{t('staff.libraries.title')}</h1>
          <div className="card" style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="sr-only" htmlFor="lib-search">{t('search.label')}</label>
            <input id="lib-search" placeholder={t('staff.libraries.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} className="card" style={{ padding: 8, flex: 1 }} />
            <button onClick={onAdd} className="btn" aria-label={t('staff.libraries.addTitle')}>＋ {t('staff.libraries.add')}</button>
          </div>
          <div className="card" style={{ padding: 0, marginTop: 12, overflow: 'hidden' }}>
            <table role="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 10 }}>{t('staff.libraries.fields.name')}</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>{t('staff.libraries.fields.address')}</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>{t('staff.libraries.fields.hours')}</th>
                  <th style={{ textAlign: 'left', padding: 10 }}>{t('staff.libraries.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={4} style={{ padding: 10 }}>{t('home.loading')}</td></tr>
                )}
                {error && !loading && (
                  <tr><td colSpan={4} style={{ padding: 10, color: 'var(--color-error)' }}>{error}</td></tr>
                )}
                {!loading && !error && data.items.map((l) => (
                  <tr key={l.id}>
                    <td style={{ padding: 10 }}>{l.name}</td>
                    <td style={{ padding: 10 }}>{l.address}</td>
                    <td style={{ padding: 10 }}>{l.hours}</td>
                    <td style={{ padding: 10, display: 'flex', gap: 6 }}>
                      <button className="btn" onClick={() => onEdit(l)} aria-label={`${t('staff.libraries.editTitle')} ${l.name}`}>{t('common.edit') || 'Edit'}</button>
                      <button className="btn" onClick={() => onDelete(l.id)} aria-label={`${t('staff.libraries.delete')} ${l.name}`}>{t('common.delete') || 'Delete'}</button>
                    </td>
                  </tr>
                ))}
                {!loading && !error && data.items.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 10, color: 'var(--color-muted)' }}>{t('staff.libraries.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('staff.libraries.prev')}</button>
            <div aria-live="polite" role="status" style={{ display: 'grid', placeItems: 'center', minWidth: 80 }}>{t('staff.libraries.pageXofY', { x: page, y: totalPages })}</div>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{t('staff.libraries.next')}</button>
          </div>
        </div>
      </div>

      <LibraryModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} onSave={onSave} />
    </RequirePermission>
  );
}
