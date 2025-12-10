/**
 * Books data service with environment-aware API endpoints and mock fallback.
 * Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL if present.
 */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Request failed ${r.status}: ${text}`);
  }
  return r.json();
}

// PUBLIC_INTERFACE
export async function listBooks(query = '') {
  /**
   * List books from API if base is defined; else from local mocks.
   * query: string to filter by title/author/genre on client if API not filtering.
   */
  if (API_BASE) {
    const url = new URL('/books', API_BASE);
    if (query) url.searchParams.set('q', query);
    try {
      return await fetchJson(url.toString());
    } catch (e) {
      // graceful fallback to mocks
      console.warn('API failed, falling back to mock data:', e.message);
    }
  }
  const data = await import('../mocks/books.json');
  let items = data.default || data;
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((b) => {
    const hay = [
      b.title,
      b.author,
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
   * Get a single book by id from API; else from local mocks.
   */
  if (API_BASE) {
    const url = new URL(`/books/${encodeURIComponent(id)}`, API_BASE);
    try {
      return await fetchJson(url.toString());
    } catch (e) {
      console.warn('API failed, falling back to mock data:', e.message);
    }
  }
  const data = await import('../mocks/books.json');
  const items = data.default || data;
  return items.find((b) => String(b.id) === String(id)) || null;
}
