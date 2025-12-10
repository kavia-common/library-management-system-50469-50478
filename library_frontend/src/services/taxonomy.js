import { v4 as uuidv4 } from 'uuid';

/**
 * Taxonomy service for Tags & Genres with dual mode:
 * - Real API when REACT_APP_API_BASE is set.
 * - Mock/localStorage when not set.
 *
 * Storage keys (mock):
 *  - taxonomy:genres
 *  - taxonomy:tags
 *  - taxonomy:bookIndex  // { [bookId]: { tags: [ids], genres: [ids] } }
 */

// Utilities for localStorage mock mode
const GENRES_KEY = 'taxonomy:genres';
const TAGS_KEY = 'taxonomy:tags';
const BOOK_INDEX_KEY = 'taxonomy:bookIndex';

function _readLS(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

function _ensureSeeds() {
  // Ensure seed data with stable IDs
  let genres = _readLS(GENRES_KEY);
  let tags = _readLS(TAGS_KEY);
  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    genres = [
      { id: 'genre_fiction', name: 'Fiction', description: '' },
      { id: 'genre_non_fiction', name: 'Non-Fiction', description: '' },
      { id: 'genre_mystery', name: 'Mystery', description: '' },
      { id: 'genre_scifi', name: 'Sci-Fi', description: '' },
    ];
    _writeLS(GENRES_KEY, genres);
  }
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    tags = [
      { id: 'tag_award', name: 'Award-winning', description: '' },
      { id: 'tag_classic', name: 'Classic', description: '' },
      { id: 'tag_new', name: 'New', description: '' },
    ];
    _writeLS(TAGS_KEY, tags);
  }
  const bookIndex = _readLS(BOOK_INDEX_KEY);
  if (!bookIndex) {
    _writeLS(BOOK_INDEX_KEY, {});
  }
}

function _searchByName(items, q) {
  if (!q) return items;
  const s = q.trim().toLowerCase();
  return items.filter((it) => it.name.toLowerCase().includes(s));
}

// PUBLIC_INTERFACE
export function isMockMode() {
  return !process.env.REACT_APP_API_BASE;
}

// Mock service implementation
const mockTaxonomyService = {
  // PUBLIC_INTERFACE
  async getGenres(search) {
    _ensureSeeds();
    const items = _readLS(GENRES_KEY) || [];
    return _searchByName(items, search);
  },
  // PUBLIC_INTERFACE
  async createGenre(data) {
    _ensureSeeds();
    const items = _readLS(GENRES_KEY) || [];
    // unique name (case-insensitive)
    const exists = items.some((g) => g.name.toLowerCase() === (data.name || '').trim().toLowerCase());
    if (exists) {
      const err = new Error('Genre name must be unique');
      err.code = 'VALIDATION';
      throw err;
    }
    const newGenre = {
      id: data.id || `genre_${uuidv4()}`,
      name: (data.name || '').trim(),
      description: data.description || '',
      color: data.color || '',
    };
    const next = [...items, newGenre];
    _writeLS(GENRES_KEY, next);
    return newGenre;
  },
  // PUBLIC_INTERFACE
  async updateGenre(id, data) {
    _ensureSeeds();
    const items = _readLS(GENRES_KEY) || [];
    const idx = items.findIndex((g) => g.id === id);
    if (idx === -1) throw new Error('Genre not found');
    // check unique name
    if (typeof data.name === 'string') {
      const name = data.name.trim();
      const exists = items.some((g) => g.id !== id && g.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        const err = new Error('Genre name must be unique');
        err.code = 'VALIDATION';
        throw err;
      }
      items[idx].name = name;
    }
    if (typeof data.description === 'string') items[idx].description = data.description;
    if (typeof data.color === 'string') items[idx].color = data.color;
    _writeLS(GENRES_KEY, items);
    return items[idx];
  },
  // PUBLIC_INTERFACE
  async deleteGenre(id) {
    _ensureSeeds();
    const items = _readLS(GENRES_KEY) || [];
    const next = items.filter((g) => g.id !== id);
    _writeLS(GENRES_KEY, next);
    // also remove from bookIndex
    const bi = _readLS(BOOK_INDEX_KEY) || {};
    Object.keys(bi).forEach((bookId) => {
      bi[bookId].genres = (bi[bookId].genres || []).filter((gid) => gid !== id);
    });
    _writeLS(BOOK_INDEX_KEY, bi);
    return { success: true };
  },

  // PUBLIC_INTERFACE
  async getTags(search) {
    _ensureSeeds();
    const items = _readLS(TAGS_KEY) || [];
    return _searchByName(items, search);
  },
  // PUBLIC_INTERFACE
  async createTag(data) {
    _ensureSeeds();
    const items = _readLS(TAGS_KEY) || [];
    const exists = items.some((t) => t.name.toLowerCase() === (data.name || '').trim().toLowerCase());
    if (exists) {
      const err = new Error('Tag name must be unique');
      err.code = 'VALIDATION';
      throw err;
    }
    const newTag = {
      id: data.id || `tag_${uuidv4()}`,
      name: (data.name || '').trim(),
      description: data.description || '',
      color: data.color || '',
    };
    const next = [...items, newTag];
    _writeLS(TAGS_KEY, next);
    return newTag;
  },
  // PUBLIC_INTERFACE
  async updateTag(id, data) {
    _ensureSeeds();
    const items = _readLS(TAGS_KEY) || [];
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tag not found');
    if (typeof data.name === 'string') {
      const name = data.name.trim();
      const exists = items.some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        const err = new Error('Tag name must be unique');
        err.code = 'VALIDATION';
        throw err;
      }
      items[idx].name = name;
    }
    if (typeof data.description === 'string') items[idx].description = data.description;
    if (typeof data.color === 'string') items[idx].color = data.color;
    _writeLS(TAGS_KEY, items);
    return items[idx];
  },
  // PUBLIC_INTERFACE
  async deleteTag(id) {
    _ensureSeeds();
    const items = _readLS(TAGS_KEY) || [];
    const next = items.filter((t) => t.id !== id);
    _writeLS(TAGS_KEY, next);
    // also remove from bookIndex
    const bi = _readLS(BOOK_INDEX_KEY) || {};
    Object.keys(bi).forEach((bookId) => {
      bi[bookId].tags = (bi[bookId].tags || []).filter((tid) => tid !== id);
    });
    _writeLS(BOOK_INDEX_KEY, bi);
    return { success: true };
  },

  // PUBLIC_INTERFACE
  async assignTagsToBook(bookId, payload) {
    _ensureSeeds();
    const bi = _readLS(BOOK_INDEX_KEY) || {};
    const normalized = {
      tags: Array.isArray(payload?.tags) ? payload.tags : [],
      genres: Array.isArray(payload?.genres) ? payload.genres : [],
    };
    bi[bookId] = normalized;
    _writeLS(BOOK_INDEX_KEY, bi);
    return { success: true, ...normalized };
  },
  // PUBLIC_INTERFACE
  async getBookTags(bookId) {
    _ensureSeeds();
    const bi = _readLS(BOOK_INDEX_KEY) || {};
    return bi[bookId] || { tags: [], genres: [] };
  },
};

// Real API service implementation
const apiBase = process.env.REACT_APP_API_BASE;

async function apiFetch(path, options = {}) {
  const url = `${apiBase}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {
      // ignore
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

const restTaxonomyService = {
  // PUBLIC_INTERFACE
  async getGenres(search) {
    const qs = search ? `?q=${encodeURIComponent(search)}` : '';
    return apiFetch(`/taxonomy/genres${qs}`);
  },
  // PUBLIC_INTERFACE
  async createGenre(data) {
    return apiFetch(`/taxonomy/genres`, { method: 'POST', body: JSON.stringify(data) });
  },
  // PUBLIC_INTERFACE
  async updateGenre(id, data) {
    return apiFetch(`/taxonomy/genres/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  // PUBLIC_INTERFACE
  async deleteGenre(id) {
    return apiFetch(`/taxonomy/genres/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  // PUBLIC_INTERFACE
  async getTags(search) {
    const qs = search ? `?q=${encodeURIComponent(search)}` : '';
    return apiFetch(`/taxonomy/tags${qs}`);
  },
  // PUBLIC_INTERFACE
  async createTag(data) {
    return apiFetch(`/taxonomy/tags`, { method: 'POST', body: JSON.stringify(data) });
  },
  // PUBLIC_INTERFACE
  async updateTag(id, data) {
    return apiFetch(`/taxonomy/tags/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  // PUBLIC_INTERFACE
  async deleteTag(id) {
    return apiFetch(`/taxonomy/tags/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  // PUBLIC_INTERFACE
  async assignTagsToBook(bookId, payload) {
    return apiFetch(`/books/${encodeURIComponent(bookId)}/taxonomy`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  // PUBLIC_INTERFACE
  async getBookTags(bookId) {
    return apiFetch(`/books/${encodeURIComponent(bookId)}/taxonomy`);
  },
};

// PUBLIC_INTERFACE
export function getTaxonomyService() {
  return isMockMode() ? mockTaxonomyService : restTaxonomyService;
}

// Convenience PUBLIC_INTERFACE for dataIO to obtain simple arrays of names
// PUBLIC_INTERFACE
export async function getAllGenres() {
  const svc = getTaxonomyService();
  const items = await svc.getGenres();
  return items;
}
// PUBLIC_INTERFACE
export async function getAllTags() {
  const svc = getTaxonomyService();
  const items = await svc.getTags();
  return items;
}
// PUBLIC_INTERFACE
export async function createGenre(payload) {
  const svc = getTaxonomyService();
  return svc.createGenre(payload);
}
// PUBLIC_INTERFACE
export async function createTag(payload) {
  const svc = getTaxonomyService();
  return svc.createTag(payload);
}

export default getTaxonomyService();
