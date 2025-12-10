 /**
  * Favorites helper with API-first approach (optional /favorites endpoints) and localStorage fallback.
  * Env: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
  */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

const LS_FAV_KEY = 'ocean-library-favorites';

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

function lsRead() {
  try {
    const raw = localStorage.getItem(LS_FAV_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function lsWrite(ids) {
  try {
    localStorage.setItem(LS_FAV_KEY, JSON.stringify(Array.isArray(ids) ? ids : []));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export async function getFavorites() {
  /** Returns array of book IDs that are favorited */
  if (API_BASE) {
    try {
      const url = new URL('/favorites', API_BASE);
      const data = await fetchJson(url.toString());
      if (Array.isArray(data)) return data.map(String);
      if (Array.isArray(data?.ids)) return data.ids.map(String);
    } catch (e) {
      console.warn('Favorites API failed; falling back to localStorage:', e.message);
    }
  }
  return lsRead().map(String);
}

// PUBLIC_INTERFACE
export async function isFavorite(bookId) {
  /** Convenience to check favorite state for a single book id */
  const ids = await getFavorites();
  return ids.includes(String(bookId));
}

// PUBLIC_INTERFACE
export async function toggleFavorite(bookId) {
  /** Toggle favorite for a book; returns updated favorites array */
  const id = String(bookId);
  if (API_BASE) {
    // Try PATCH/POST/DELETE styles. Prefer POST to /favorites/:id/toggle when available.
    try {
      const toggleUrl = new URL(`/favorites/${encodeURIComponent(id)}/toggle`, API_BASE);
      const data = await fetchJson(toggleUrl.toString(), { method: 'POST' });
      if (Array.isArray(data)) return data.map(String);
      if (Array.isArray(data?.ids)) return data.ids.map(String);
    } catch (e) {
      // fallback to PUT/DELETE convention
      try {
        // First fetch current
        const current = await getFavorites();
        const exists = current.includes(id);
        if (!exists) {
          const putUrl = new URL(`/favorites/${encodeURIComponent(id)}`, API_BASE);
          await fetchJson(putUrl.toString(), { method: 'PUT' });
        } else {
          const delUrl = new URL(`/favorites/${encodeURIComponent(id)}`, API_BASE);
          await fetchJson(delUrl.toString(), { method: 'DELETE' });
        }
        return await getFavorites();
      } catch (e2) {
        console.warn('Favorites API toggle fallback failed; using localStorage:', e2.message);
      }
    }
  }
  // LocalStorage fallback
  const ids = lsRead().map(String);
  const exists = ids.includes(id);
  const next = exists ? ids.filter(x => x !== id) : [id, ...ids];
  lsWrite(next);
  return next;
}
