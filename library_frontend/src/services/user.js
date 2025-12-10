const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

const LS_PROFILE_KEY = 'ocean-library-user-profile';
const LS_LISTS_KEY = 'ocean-library-reading-lists';
const LS_BORROW_HISTORY_KEY = 'ocean-library-borrow-history';

// Helpers
async function fetchJson(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Request failed ${r.status}: ${text}`);
  }
  if (r.status === 204) return null;
  const ct = r.headers.get('content-type') || '';
  if (ct.includes('application/json')) return r.json();
  return null;
}

function readLS(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    return parsed == null ? def : parsed;
  } catch {
    return def;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function seedDefaultListsIfNeeded() {
  const existing = readLS(LS_LISTS_KEY, null);
  if (existing) return existing;
  const seeded = {
    lists: [
      { id: 'default-want', name: 'Want to Read', isDefault: true, bookIds: [] },
      { id: 'default-current', name: 'Currently Reading', isDefault: true, bookIds: [] },
      { id: 'default-finished', name: 'Finished', isDefault: true, bookIds: [] },
    ]
  };
  writeLS(LS_LISTS_KEY, seeded);
  return seeded;
}

function normalizeLists(obj) {
  if (!obj || !Array.isArray(obj.lists)) {
    return seedDefaultListsIfNeeded();
  }
  // Ensure shape
  const cleaned = {
    lists: obj.lists.map(l => ({
      id: String(l.id),
      name: String(l.name || 'List'),
      isDefault: !!l.isDefault,
      bookIds: Array.isArray(l.bookIds) ? l.bookIds.map(String) : [],
    }))
  };
  // Ensure defaults exist
  const defaultIds = new Set(cleaned.lists.filter(l => l.isDefault).map(l => l.id));
  if (defaultIds.size === 0) {
    const seed = seedDefaultListsIfNeeded();
    return seed;
  }
  return cleaned;
}

function profileDefaults() {
  return {
    displayName: 'Reader',
    avatarUrl: '',
    initials: 'R',
    theme: 'system', // 'light' | 'dark' | 'system'
  };
}

// PUBLIC_INTERFACE
export async function getProfile() {
  /** Fetch user profile from API-first, fallback to localStorage
   * Returns { displayName, avatarUrl, initials, theme }
   */
  if (API_BASE) {
    try {
      const url = new URL('/user/profile', API_BASE);
      const data = await fetchJson(url.toString());
      if (data && typeof data === 'object') return { ...profileDefaults(), ...data };
    } catch (e) {
      console.warn('Profile API failed; using localStorage:', e.message);
    }
  }
  const p = readLS(LS_PROFILE_KEY, null);
  if (!p) {
    const def = profileDefaults();
    writeLS(LS_PROFILE_KEY, def);
    return def;
  }
  // Ensure initials if not provided and displayName exists
  if (!p.initials && p.displayName) {
    p.initials = p.displayName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  }
  return { ...profileDefaults(), ...p };
}

// PUBLIC_INTERFACE
export async function updateProfile(partial) {
  /** Update user profile (API-first PUT /user/profile), fallback to localStorage. Returns saved profile. */
  const body = { ...partial };
  if (API_BASE) {
    try {
      const url = new URL('/user/profile', API_BASE);
      const saved = await fetchJson(url.toString(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return { ...profileDefaults(), ...saved };
    } catch (e) {
      console.warn('Update profile API failed; using localStorage:', e.message);
    }
  }
  const cur = await getProfile();
  const next = { ...cur, ...body };
  // derive initials if avatarUrl empty and displayName set
  if ((!next.avatarUrl || !String(next.avatarUrl).trim()) && next.displayName && !next.initials) {
    next.initials = next.displayName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  }
  writeLS(LS_PROFILE_KEY, next);
  return next;
}

// PUBLIC_INTERFACE
export async function getReadingLists() {
  /** Get reading lists (API-first /user/reading-lists). Returns { lists: [{id,name,isDefault,bookIds:string[]}, ...] } */
  if (API_BASE) {
    try {
      const url = new URL('/user/reading-lists', API_BASE);
      const data = await fetchJson(url.toString());
      return normalizeLists(data);
    } catch (e) {
      console.warn('Reading lists API failed; using localStorage:', e.message);
    }
  }
  return normalizeLists(readLS(LS_LISTS_KEY, null));
}

// PUBLIC_INTERFACE
export async function createList(name) {
  /** Create a custom list by name (API-first), returns updated { lists } */
  const payload = { name };
  if (API_BASE) {
    try {
      const url = new URL('/user/reading-lists', API_BASE);
      const data = await fetchJson(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return normalizeLists(data);
    } catch (e) {
      console.warn('Create list API failed; using localStorage:', e.message);
    }
  }
  const data = await getReadingLists();
  const id = `list-${Date.now()}`;
  const next = { lists: [...data.lists, { id, name: String(name || 'List'), isDefault: false, bookIds: [] }] };
  writeLS(LS_LISTS_KEY, next);
  return next;
}

// PUBLIC_INTERFACE
export async function renameList(listId, newName) {
  /** Rename a list (custom only), returns updated { lists } */
  const id = String(listId);
  const payload = { name: newName };
  if (API_BASE) {
    try {
      const url = new URL(`/user/reading-lists/${encodeURIComponent(id)}`, API_BASE);
      const data = await fetchJson(url.toString(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return normalizeLists(data);
    } catch (e) {
      console.warn('Rename list API failed; using localStorage:', e.message);
    }
  }
  const data = await getReadingLists();
  const next = {
    lists: data.lists.map(l => (String(l.id) === id ? { ...l, name: String(newName || l.name) } : l))
  };
  writeLS(LS_LISTS_KEY, next);
  return next;
}

// PUBLIC_INTERFACE
export async function deleteList(listId) {
  /** Delete a custom list (cannot delete defaults). Returns updated { lists } */
  const id = String(listId);
  if (API_BASE) {
    try {
      const url = new URL(`/user/reading-lists/${encodeURIComponent(id)}`, API_BASE);
      const data = await fetchJson(url.toString(), { method: 'DELETE' });
      return normalizeLists(data);
    } catch (e) {
      console.warn('Delete list API failed; using localStorage:', e.message);
    }
  }
  const data = await getReadingLists();
  const target = data.lists.find(l => String(l.id) === id);
  if (target?.isDefault) {
    // don't delete defaults
    return data;
  }
  const next = { lists: data.lists.filter(l => String(l.id) !== id) };
  writeLS(LS_LISTS_KEY, next);
  return next;
}

// PUBLIC_INTERFACE
export async function addToList(listId, bookId) {
  /** Add a bookId to a list, returns updated { lists } */
  const id = String(listId);
  const bid = String(bookId);
  if (API_BASE) {
    try {
      const url = new URL(`/user/reading-lists/${encodeURIComponent(id)}/books`, API_BASE);
      const data = await fetchJson(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bid }),
      });
      return normalizeLists(data);
    } catch (e) {
      console.warn('Add to list API failed; using localStorage:', e.message);
    }
  }
  const data = await getReadingLists();
  const next = {
    lists: data.lists.map(l => {
      if (String(l.id) !== id) return l;
      const exists = l.bookIds.map(String).includes(bid);
      return { ...l, bookIds: exists ? l.bookIds : [bid, ...l.bookIds] };
    })
  };
  writeLS(LS_LISTS_KEY, next);
  return next;
}

// PUBLIC_INTERFACE
export async function removeFromList(listId, bookId) {
  /** Remove a bookId from a list, returns updated { lists } */
  const id = String(listId);
  const bid = String(bookId);
  if (API_BASE) {
    try {
      const url = new URL(`/user/reading-lists/${encodeURIComponent(id)}/books/${encodeURIComponent(bid)}`, API_BASE);
      const data = await fetchJson(url.toString(), { method: 'DELETE' });
      return normalizeLists(data);
    } catch (e) {
      console.warn('Remove from list API failed; using localStorage:', e.message);
    }
  }
  const data = await getReadingLists();
  const next = {
    lists: data.lists.map(l => (String(l.id) === id ? { ...l, bookIds: l.bookIds.filter(x => String(x) !== bid) } : l))
  };
  writeLS(LS_LISTS_KEY, next);
  return next;
}

// PUBLIC_INTERFACE
export async function getBorrowHistory(filter = 'all') {
  /** Get chronological borrowing history records.
   * Each record: { id, bookId, title, borrowedAt, returnedAt|null, dueDate|null }
   * Filters: 'all' | 'active' | 'returned' | 'overdue'
   * API-first: GET /user/borrow-history?filter=...
   * Fallback: localStorage (key ocean-library-borrow-history), seeded opportunistically by borrow/return flows.
   */
  if (API_BASE) {
    try {
      const url = new URL('/user/borrow-history', API_BASE);
      if (filter && filter !== 'all') url.searchParams.set('filter', filter);
      const data = await fetchJson(url.toString());
      return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.warn('Borrow history API failed; using localStorage:', e.message);
    }
  }
  const all = readLS(LS_BORROW_HISTORY_KEY, []);
  const now = Date.now();
  const result = all.filter(rec => {
    if (filter === 'active') return !rec.returnedAt;
    if (filter === 'returned') return !!rec.returnedAt;
    if (filter === 'overdue') return !rec.returnedAt && rec.dueDate && new Date(rec.dueDate).getTime() < now;
    return true;
  }).sort((a, b) => new Date(b.borrowedAt) - new Date(a.borrowedAt));
  return result;
}

// PUBLIC_INTERFACE
export function recordBorrowEvent({ bookId, title, dueDate }) {
  /** Record a borrow event client-side for fallback history. */
  const rec = {
    id: `bh-${Date.now()}`,
    bookId: String(bookId),
    title: String(title || ''),
    borrowedAt: new Date().toISOString(),
    returnedAt: null,
    dueDate: dueDate || null,
  };
  const all = readLS(LS_BORROW_HISTORY_KEY, []);
  all.unshift(rec);
  writeLS(LS_BORROW_HISTORY_KEY, all);
  return rec;
}

// PUBLIC_INTERFACE
export function recordReturnEvent({ bookId }) {
  /** Record a return event client-side for fallback history; matches latest active record for bookId. */
  const all = readLS(LS_BORROW_HISTORY_KEY, []);
  for (const rec of all) {
    if (String(rec.bookId) === String(bookId) && !rec.returnedAt) {
      rec.returnedAt = new Date().toISOString();
      break;
    }
  }
  writeLS(LS_BORROW_HISTORY_KEY, all);
  return true;
}
