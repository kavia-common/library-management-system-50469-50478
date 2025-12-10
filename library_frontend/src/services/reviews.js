 /** 
  * Reviews service with API-first approach and localStorage fallback.
  * Env: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
  */
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

const LS_REVIEWS_KEY = 'ocean-library-reviews';

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

function lsReadAll() {
  try {
    const raw = localStorage.getItem(LS_REVIEWS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function lsWriteAll(obj) {
  try {
    localStorage.setItem(LS_REVIEWS_KEY, JSON.stringify(obj || {}));
  } catch {
    // ignore
  }
}

function ensureReview(review) {
  const r = review || {};
  const ratingNum = Number(r.rating);
  return {
    id: r.id || String(Date.now()),
    user: r.user || 'Anonymous',
    rating: Number.isFinite(ratingNum) ? Math.min(5, Math.max(1, ratingNum)) : 5,
    text: (r.text || '').trim(),
    createdAt: r.createdAt || new Date().toISOString(),
  };
}

// PUBLIC_INTERFACE
export async function getReviews(bookId) {
  /** Get list of reviews for a book. Returns { reviews: [], average: number, count: number } */
  if (API_BASE) {
    const url = new URL(`/books/${encodeURIComponent(bookId)}/reviews`, API_BASE);
    try {
      const list = await fetchJson(url.toString());
      const reviews = Array.isArray(list) ? list : (list?.reviews || []);
      const count = reviews.length;
      const average = count === 0 ? 0 : (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count);
      return { reviews, average, count };
    } catch (e) {
      console.warn('Reviews API failed; falling back to localStorage:', e.message);
    }
  }
  // LocalStorage fallback
  const all = lsReadAll();
  const reviews = Array.isArray(all[bookId]) ? all[bookId] : [];
  const count = reviews.length;
  const average = count === 0 ? 0 : (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count);
  return { reviews, average, count };
}

// PUBLIC_INTERFACE
export async function addReview(bookId, review) {
  /** Add a review for a book. Returns persisted review and aggregate. */
  const body = ensureReview(review);
  if (API_BASE) {
    const url = new URL(`/books/${encodeURIComponent(bookId)}/reviews`, API_BASE);
    try {
      const saved = await fetchJson(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Some backends may return the new list or saved review; normalize result
      if (Array.isArray(saved)) {
        const reviews = saved;
        const count = reviews.length;
        const average = count === 0 ? 0 : (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count);
        return { review: reviews[reviews.length - 1], reviews, average, count };
      }
      const { reviews: newReviews } = await getReviews(bookId);
      const count = newReviews.length;
      const average = count === 0 ? 0 : (newReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count);
      return { review: saved, reviews: newReviews, average, count };
    } catch (e) {
      console.warn('Add review API failed; falling back to localStorage:', e.message);
    }
  }
  // LocalStorage fallback
  const all = lsReadAll();
  const list = Array.isArray(all[bookId]) ? all[bookId].slice() : [];
  list.push(body);
  all[bookId] = list;
  lsWriteAll(all);
  const count = list.length;
  const average = count === 0 ? 0 : (list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count);
  return { review: body, reviews: list, average, count };
}
