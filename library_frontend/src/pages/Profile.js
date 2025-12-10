import React, { useEffect, useMemo, useState } from 'react';
import { getProfile, updateProfile, getReadingLists, createList, renameList, deleteList, getBorrowHistory } from '../services/user';

// Small avatar component
function Avatar({ profile, size = 36 }) {
  const { avatarUrl, initials } = profile || {};
  const style = {
    width: size,
    height: size,
    borderRadius: 999,
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, var(--color-primary), #60A5FA)',
    color: 'white',
    fontWeight: 800,
    border: '2px solid white',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden'
  };
  if (avatarUrl && String(avatarUrl).trim()) {
    return <img src={avatarUrl} alt="User avatar" width={size} height={size} style={{ ...style, objectFit: 'cover' }} />;
  }
  return <div style={style} aria-hidden>{(initials || 'U').slice(0, 2).toUpperCase()}</div>;
}

function Tabs({ current, onChange }) {
  const tabs = [
    { id: 'info', label: 'Profile Info' },
    { id: 'lists', label: 'Reading Lists' },
    { id: 'history', label: 'Borrowing History' },
  ];
  return (
    <div role="tablist" aria-label="Profile sections" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={current === t.id}
          className="btn"
          onClick={() => onChange(t.id)}
          style={{
            background: current === t.id ? 'var(--color-primary)' : 'var(--color-muted)',
            color: current === t.id ? 'white' : 'var(--color-text)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function ProfilePage() {
  const [tab, setTab] = useState('info');

  // Profile info states
  const [profile, setProfile] = useState(null);
  const [loadingP, setLoadingP] = useState(true);
  const [savingP, setSavingP] = useState(false);
  const [errP, setErrP] = useState('');

  // Lists
  const [lists, setLists] = useState([]);
  const [loadingL, setLoadingL] = useState(true);
  const [errL, setErrL] = useState('');
  const [newListName, setNewListName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // History
  const [history, setHistory] = useState([]);
  const [loadingH, setLoadingH] = useState(true);
  const [errH, setErrH] = useState('');
  const [filterH, setFilterH] = useState('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProfile();
        if (alive) setProfile(p);
      } catch (e) {
        if (alive) setErrP(e.message || 'Failed to load profile');
      } finally {
        if (alive) setLoadingP(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadLists = async () => {
    setLoadingL(true);
    setErrL('');
    try {
      const data = await getReadingLists();
      setLists(data.lists || []);
    } catch (e) {
      setErrL(e.message || 'Failed to load lists');
    } finally {
      setLoadingL(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const loadHistory = async (flt = filterH) => {
    setLoadingH(true);
    setErrH('');
    try {
      const items = await getBorrowHistory(flt);
      setHistory(items);
    } catch (e) {
      setErrH(e.message || 'Failed to load history');
    } finally {
      setLoadingH(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSavingP(true);
    setErrP('');
    try {
      const saved = await updateProfile(profile);
      setProfile(saved);
    } catch (e2) {
      setErrP(e2.message || 'Failed to save profile');
    } finally {
      setSavingP(false);
    }
  };

  const themeNote = 'light/dark/system';
  const onThemeChange = (val) => {
    setProfile(cur => ({ ...cur, theme: val }));
    // We keep the theme choice for API when available; CSS theme switching can be implemented here if needed.
  };

  const filteredHistory = useMemo(() => history, [history]);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Avatar profile={profile || {}} size={40} />
          <div>
            <strong style={{ fontSize: 18 }}>Your Profile</strong>
            <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>Manage your preferences and reading activity</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <Tabs current={tab} onChange={setTab} />
        </div>

        {/* Tab Panels */}
        {tab === 'info' && (
          <div role="tabpanel" aria-label="Profile Info" style={{ display: 'grid', gap: 12 }}>
            {loadingP && <div className="empty">Loading profile…</div>}
            {!loadingP && errP && <div className="empty" role="alert">{errP}</div>}
            {!loadingP && !errP && profile && (
              <form onSubmit={handleSaveProfile} noValidate style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
                <div>
                  <label className="label" htmlFor="displayName">Display Name</label>
                  <input
                    id="displayName"
                    className="search-input"
                    value={profile.displayName || ''}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="avatarUrl">Avatar URL (optional)</label>
                  <input
                    id="avatarUrl"
                    className="search-input"
                    value={profile.avatarUrl || ''}
                    onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                    placeholder="https://…/avatar.png"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="initials">Initials (used when no avatar)</label>
                  <input
                    id="initials"
                    className="search-input"
                    value={profile.initials || ''}
                    onChange={(e) => setProfile({ ...profile, initials: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="JD"
                  />
                </div>
                <div>
                  <label className="label">Theme Preference</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['light', 'dark', 'system'].map(t => (
                      <button
                        key={t}
                        type="button"
                        className="btn"
                        aria-pressed={profile.theme === t}
                        onClick={() => onThemeChange(t)}
                        style={{
                          background: profile.theme === t ? 'var(--color-secondary)' : 'var(--color-muted)',
                          color: profile.theme === t ? 'white' : 'var(--color-text)',
                        }}
                        title={`Set ${t} theme`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 4 }}>
                    Preference stored locally and via API when configured ({themeNote})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn" disabled={savingP}>{savingP ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === 'lists' && (
          <div role="tabpanel" aria-label="Reading Lists" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>Reading Lists</strong>
              <span className="tag">{lists.length}</span>
            </div>
            {loadingL && <div className="empty">Loading lists…</div>}
            {!loadingL && errL && <div className="empty" role="alert">{errL}</div>}
            {!loadingL && !errL && (
              <>
                <div className="card" style={{ padding: 12, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="search-input"
                      placeholder="New list name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      style={{ maxWidth: 300 }}
                    />
                    <button
                      className="btn"
                      onClick={async () => {
                        if (!newListName.trim()) return;
                        const prev = lists.slice();
                        const tempId = `tmp-${Date.now()}`;
                        // Optimistic
                        setLists([...lists, { id: tempId, name: newListName.trim(), isDefault: false, bookIds: [] }]);
                        setNewListName('');
                        try {
                          const data = await createList(prev && newListName.trim());
                          setLists(data.lists || []);
                        } catch (e) {
                          setErrL(e.message || 'Failed to create list');
                          setLists(prev);
                        }
                      }}
                    >
                      + Create List
                    </button>
                  </div>
                </div>

                {lists.length === 0 && <div className="empty">No lists yet.</div>}
                {lists.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {lists.map(l => (
                      <div
                        key={l.id}
                        className="card"
                        style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{l.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                            {l.isDefault ? 'Default list' : 'Custom list'} • {l.bookIds?.length || 0} books
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {renamingId === l.id ? (
                            <>
                              <input
                                className="search-input"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                style={{ maxWidth: 200 }}
                              />
                              <button
                                className="btn"
                                onClick={async () => {
                                  if (!renameValue.trim()) { setRenamingId(null); return; }
                                  const prev = lists.slice();
                                  setLists(cur => cur.map(x => x.id === l.id ? { ...x, name: renameValue.trim() } : x));
                                  setRenamingId(null);
                                  try {
                                    const data = await renameList(l.id, renameValue.trim());
                                    setLists(data.lists || []);
                                  } catch (e) {
                                    setErrL(e.message || 'Failed to rename');
                                    setLists(prev);
                                  }
                                }}
                              >
                                Save
                              </button>
                              <button
                                className="btn"
                                style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }}
                                onClick={() => { setRenamingId(null); setRenameValue(''); }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {!l.isDefault && (
                                <button
                                  className="btn"
                                  style={{ background: 'var(--color-muted)', color: 'var(--color-text)' }}
                                  onClick={() => { setRenamingId(l.id); setRenameValue(l.name); }}
                                >
                                  Rename
                                </button>
                              )}
                              {!l.isDefault && (
                                <button
                                  className="btn"
                                  style={{ background: 'var(--color-error)' }}
                                  onClick={async () => {
                                    const prev = lists.slice();
                                    setLists(cur => cur.filter(x => x.id !== l.id));
                                    try {
                                      const data = await deleteList(l.id);
                                      setLists(data.lists || []);
                                    } catch (e) {
                                      setErrL(e.message || 'Failed to delete');
                                      setLists(prev);
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div role="tabpanel" aria-label="Borrowing History" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>Borrowing History</strong>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['all', 'active', 'returned', 'overdue'].map(f => (
                  <button
                    key={f}
                    className="btn"
                    aria-pressed={filterH === f}
                    onClick={async () => { setFilterH(f); await loadHistory(f); }}
                    style={{ background: filterH === f ? 'var(--color-secondary)' : 'var(--color-muted)', color: filterH === f ? 'white' : 'var(--color-text)' }}
                  >
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {loadingH && <div className="empty">Loading history…</div>}
            {!loadingH && errH && <div className="empty" role="alert">{errH}</div>}
            {!loadingH && !errH && filteredHistory.length === 0 && (
              <div className="empty">No history for selected filter.</div>
            )}
            {!loadingH && !errH && filteredHistory.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {filteredHistory.map((rec) => {
                  const overdue = !rec.returnedAt && rec.dueDate && new Date(rec.dueDate).getTime() < Date.now();
                  return (
                    <div key={rec.id} className="card" style={{ padding: 12, borderColor: overdue ? 'var(--color-error)' : 'var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{rec.title || `Book #${rec.bookId}`}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>
                            Borrowed: {rec.borrowedAt ? new Date(rec.borrowedAt).toLocaleString() : '—'}
                            {rec.returnedAt ? ` • Returned: ${new Date(rec.returnedAt).toLocaleString()}` : ''}
                          </div>
                        </div>
                        <div>
                          <span className="tag" style={{ background: overdue ? 'var(--color-error)' : 'var(--color-muted)', color: overdue ? 'white' : 'var(--color-text)' }}>
                            {rec.dueDate ? `Due ${new Date(rec.dueDate).toLocaleDateString()}` : 'No due date'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
