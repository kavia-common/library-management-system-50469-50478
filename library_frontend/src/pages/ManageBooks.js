import React, { useEffect, useMemo, useState } from 'react';
import { listBooks, createBook, updateBook, deleteBook, borrowBook, returnBook } from '../services/books';
import { EmptyState } from '../components/States';
import BookForm from '../components/management/BookForm';
import ConfirmDialog from '../components/management/ConfirmDialog';

// PUBLIC_INTERFACE
export default function ManageBooks() {
  /**
   * Page to manage book records (create, update, delete).
   * - Shows a list/table of books
   * - Add/Edit in a modal with BookForm
   * - Delete with confirmation dialog
   * - Optimistic updates with loading/error states
   */
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [target, setTarget] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await listBooks('');
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(b => {
      const hay = [
        b.title || '',
        b.author || '',
        (b.genres || []).join(' '),
        String(b.year || '')
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [books, search]);

  const onAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const onEdit = (book) => {
    setEditing(book);
    setShowForm(true);
  };

  const onDelete = (book) => {
    setTarget(book);
    setShowConfirm(true);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        // optimistic update
        const prev = books.slice();
        const idx = prev.findIndex(b => String(b.id) === String(editing.id));
        const optimistic = prev.slice();
        if (idx >= 0) optimistic[idx] = { ...prev[idx], ...values };
        setBooks(optimistic);
        await updateBook(editing.id, values);
      } else {
        // optimistic create with temp id
        const tempId = `temp-${Date.now()}`;
        const optimisticItem = { id: tempId, ...values };
        setBooks([optimisticItem, ...books]);
        const created = await createBook(values);
        // replace temp with real
        setBooks(cur => cur.map(b => (b.id === tempId ? created : b)));
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      setErr(e.message || 'Failed to save book');
      // refresh to sync
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      // optimistic delete
      const id = target.id;
      setBooks(cur => cur.filter(b => String(b.id) !== String(id)));
      await deleteBook(id);
      setShowConfirm(false);
      setTarget(null);
    } catch (e) {
      setErr(e.message || 'Failed to delete');
      await refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="search"
          className="search-input"
          style={{ maxWidth: 420 }}
          placeholder="Filter books…"
          aria-label="Filter books"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ marginLeft: 'auto' }} />
        <button className="btn" onClick={onAdd} aria-label="Add a new book">+ Add Book</button>
      </div>

      {loading && (
        <div className="empty" role="status">Loading books…</div>
      )}

      {!loading && err && (
        <div className="empty" role="alert">Error: {err}</div>
      )}

      {!loading && !err && filtered.length === 0 && (
        <EmptyState message={search ? `No results for "${search}"` : 'No books yet.'} />
      )}

      {!loading && !err && filtered.length > 0 && (
        <div className="table-wrap" role="table" aria-label="Book list" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Author</th>
                <th style={thStyle}>Genre(s)</th>
                <th style={thStyle}>Year</th>
                <th style={thStyle} aria-label="Actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={trStyle}>
                  <td style={tdStyle}>{b.title}</td>
                  <td style={tdStyle}>{b.author}</td>
                  <td style={tdStyle}>{(b.genres || []).join(', ')}</td>
                  <td style={tdStyle}>{b.year || '—'}</td>
                  <td style={{ ...tdStyle }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn" style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }} onClick={() => onEdit(b)} aria-label={`Edit ${b.title}`}>Edit</button>
                      <button className="btn" style={{ background: 'var(--color-error)' }} onClick={() => onDelete(b)} aria-label={`Delete ${b.title}`}>Delete</button>
                      {/* Optional quick borrow/return */}
                      {(!b.borrowed && b.available !== false) ? (
                        <button
                          className="btn"
                          onClick={async () => {
                            // quick borrow 14 days
                            const dt = new Date(); dt.setDate(dt.getDate() + 14);
                            const due = dt.toISOString();
                            // optimistic
                            setBooks(cur => cur.map(x => String(x.id) === String(b.id) ? { ...x, borrowed: true, available: false, dueDate: due } : x));
                            try { await borrowBook(b.id, { dueDate: due }); } catch { await refresh(); }
                          }}
                          title="Quick borrow (2 weeks)"
                        >
                          Borrow
                        </button>
                      ) : (
                        <button
                          className="btn"
                          style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }}
                          onClick={async () => {
                            // optimistic
                            setBooks(cur => cur.map(x => String(x.id) === String(b.id) ? { ...x, borrowed: false, available: true, dueDate: null } : x));
                            try { await returnBook(b.id); } catch { await refresh(); }
                          }}
                          title="Return book"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="book-form-title">
          <div className="modal-panel">
            <div className="modal-header">
              <strong id="book-form-title" style={{ fontSize: 18 }}>
                {editing ? 'Edit Book' : 'Add Book'}
              </strong>
              <button className="modal-close" onClick={() => { if (!saving) { setShowForm(false); setEditing(null); } }} aria-label="Close form">✕</button>
            </div>
            <div className="modal-body">
              <BookForm
                initialValues={editing || { title: '', author: '', genre: '', year: '' }}
                loading={saving}
                onCancel={() => { if (!saving) { setShowForm(false); setEditing(null); } }}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Delete Book"
          message={`Are you sure you want to delete "${target?.title}"? This action cannot be undone.`}
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          onCancel={() => (!deleting && setShowConfirm(false))}
          onConfirm={confirmDelete}
          tone="danger"
        />
      )}
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  fontWeight: 700,
  color: 'var(--color-text)',
  padding: '12px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  position: 'sticky',
  top: 0,
};

const tdStyle = {
  padding: '12px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
};

const trStyle = {
  transition: 'background .15s ease',
};
