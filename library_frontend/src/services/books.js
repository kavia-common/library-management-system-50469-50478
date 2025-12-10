/**
 * Books data service with environment-aware API endpoints and mock fallback.
 * Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL if present.
 */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

const LS_KEY = 'ocean-library-books';

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

function normalizeBookInput(payload) {
  // Accept {title, author, genre, year} and map to {title, author, genres: [genre], year}
  const { title, author, genre, year, genres } = payload || {};
  const g = genre ?? (Array.isArray(genres) ? genres[0] : undefined);
  const out = {
    title,
    author,
    year,
  };
  if (g && String(g).trim()) out.genres = [String(g).trim()];
  else if (Array.isArray(genres)) out.genres = genres;
  return out;
}

function lsRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function lsWrite(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items || []));
  } catch {
    // ignore
  }
}

function withSimulatedBorrowed(items) {
  // Ensure resilience: if 'borrowed' missing, simulate based on availability or random fallback
  return (items || []).map((b) => {
    if (typeof b.borrowed === 'boolean') return b;
    // prefer using available flag if present
    if (typeof b.available === 'boolean') {
      return { ...b, borrowed: !b.available };
    }
    // otherwise simulate as false to avoid inflating counts
    return { ...b, borrowed: false };
  });
}

function ensureCreatedAt(items) {
  return (items || []).map((b) => {
    if (b.createdAt) return b;
    // Approximate createdAt by using id numeric or now
    let created = Date.now();
    const idNum = Number(b.id);
    if (Number.isFinite(idNum) && idNum > 0) {
      // spread older ids earlier
      created = Date.now() - (1000 * 60 * 60 * 24 * (100 - Math.min(idNum, 100)));
    }
    return { ...b, createdAt: new Date(created).toISOString() };
  });
}

async function mockLoad() {
  const existing = lsRead();
  if (Array.isArray(existing)) return ensureCreatedAt(withSimulatedBorrowed(existing));
  // seed from static mocks once
  const data = await import('../mocks/books.json');
  const items = data.default || data;
  // augment seeded data with simulated fields
  const enhanced = ensureCreatedAt(withSimulatedBorrowed(items));
  lsWrite(enhanced);
  return enhanced;
}

function mockNextId(items) {
  const max = items.reduce((m, b) => Math.max(m, Number(b.id) || 0), 0);
  return String(max + 1);
}

// PUBLIC_INTERFACE
export async function listBooks(query = '') {
  /**
   * List books from API if base is defined; else from LS-backed mocks.
   * query: string to filter by title/author/genre on client if API not filtering.
   */
  if (API_BASE) {
    const url = new URL('/books', API_BASE);
    if (query) url.searchParams.set('q', query);
    try {
      const data = await fetchJson(url.toString());
      return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.warn('API failed, falling back to mock data:', e.message);
    }
  }
  const items = await mockLoad();
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((b) => {
    const hay = [
      b.title || '',
      b.author || '',
      (b.genres || []).join(' '),
      String(b.year || ''),
      b.isbn || ''
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

// PUBLIC_INTERFACE
export async function getBook(id) {
  /**
   * Get a single book by id from API; else from LS-backed mocks.
   */
  if (API_BASE) {
    const url = new URL(`/books/${encodeURIComponent(id)}`, API_BASE);
    try {
      return await fetchJson(url.toString());
    } catch (e) {
      console.warn('API failed, falling back to mock data:', e.message);
    }
  }
  const items = await mockLoad();
  return items.find((b) => String(b.id) === String(id)) || null;
}

// PUBLIC_INTERFACE
export async function createBook(payload) {
  /**
   * Create a book via API POST /books; else persist into localStorage.
   * payload: { title, author, genre, year }
   */
  const normalized = normalizeBookInput(payload);
  const body = JSON.stringify(normalized);
  if (API_BASE) {
    const url = new URL('/books', API_BASE);
    try {
      const created = await fetchJson(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return created;
    } catch (e) {
      console.warn('API create failed, falling back to mock data:', e.message);
    }
  }
  const items = await mockLoad();
  const newItem = {
    id: mockNextId(items),
    available: true,
    rating: 0,
    borrowed: false,
    createdAt: new Date().toISOString(),
    ...normalized,
  };
  const next = [newItem, ...items];
  lsWrite(next);
  return newItem;
}

// PUBLIC_INTERFACE
export async function updateBook(id, payload) {
  /**
   * Update a book via API PUT /books/:id; else update in localStorage.
   * payload: { title?, author?, genre?, year? }
   */
  const bodyObj = normalizeBookInput(payload);
  if (API_BASE) {
    const url = new URL(`/books/${encodeURIComponent(id)}`, API_BASE);
    try {
      const updated = await fetchJson(url.toString(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
      });
      return updated;
    } catch (e) {
      console.warn('API update failed, falling back to mock data:', e.message);
    }
  }
  const items = await mockLoad();
  const idx = items.findIndex(b => String(b.id) === String(id));
  if (idx === -1) throw new Error('Book not found');
  const updated = { ...items[idx], ...bodyObj };
  const next = items.slice();
  next[idx] = updated;
  lsWrite(next);
  return updated;
}

// PUBLIC_INTERFACE
export async function deleteBook(id) {
  /**
   * Delete a book via API DELETE /books/:id; else remove from localStorage.
   */
  if (API_BASE) {
    const url = new URL(`/books/${encodeURIComponent(id)}`, API_BASE);
    try {
      await fetchJson(url.toString(), { method: 'DELETE' });
      return true;
    } catch (e) {
      console.warn('API delete failed, falling back to mock data:', e.message);
    }
  }
  const items = await mockLoad();
  const next = items.filter(b => String(b.id) !== String(id));
  lsWrite(next);
  return true;
}

// PUBLIC_INTERFACE
export async function getCountsSummary() {
  /**
   * Returns { total: number, borrowed: number }
   * API-first: tries /books and computes; if backend provides /books/summary use that if present
   */
  // Try an optional summary endpoint if available
  if (API_BASE) {
    try {
      const urlSummary = new URL('/books/summary', API_BASE);
      const data = await fetchJson(urlSummary.toString());
      if (data && typeof data.total === 'number') {
        return {
          total: Number(data.total) || 0,
          borrowed: Number(data.borrowed) || 0,
        };
      }
    } catch {
      // ignore, fallback to listing
    }
  }

  const list = await listBooks('');
  const safe = withSimulatedBorrowed(list);
  const total = safe.length;
  const borrowed = safe.reduce((acc, b) => acc + (b.borrowed ? 1 : 0), 0);
  return { total, borrowed };
}

// PUBLIC_INTERFACE
export async function getRecentBooks(limit = 5) {
  /**
   * Returns an array of most recent books, sorted by createdAt descending.
   * API-first: GET /books?sort=createdAt&limit=N
   */
  if (API_BASE) {
    try {
      const url = new URL('/books', API_BASE);
      url.searchParams.set('sort', 'createdAt');
      url.searchParams.set('limit', String(limit));
      const data = await fetchJson(url.toString());
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      return items;
    } catch (e) {
      console.warn('API recent failed; falling back to mock data:', e.message);
    }
  }
  const items = await mockLoad();
  const withDates = ensureCreatedAt(items);
  const sorted = withDates
    .slice()
    .sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  return sorted.slice(0, limit);
}
