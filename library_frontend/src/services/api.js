import { getAllBooks, getBook as dbGetBook, putBooks, putBook, getFavorites as dbGetFavorites, addFavorite as dbAddFavorite, removeFavorite as dbRemoveFavorite } from '../storage/db';
import { initializeFavoritesMigration, isOnline, queueToggleFavorite, startAutoSync } from './sync';

const envBase =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  '';

/**
 * Resolve API base from env; default to relative "/api" if not set.
 */
const API_BASE = envBase || '/api';

// Simple fetch helper
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Map backend book data to client model with locale-aware getters.
 * Backend may provide:
 * - title_translations: { en: '...', es: '...' }
 * - description_translations: { en: '...', es: '...' }
 */
function mapBook(raw) {
  const titleTranslations = raw.title_translations || raw.titleTranslations || {};
  const descriptionTranslations = raw.description_translations || raw.descriptionTranslations || {};

  return {
    id: raw.id,
    title: raw.title,
    author: raw.author,
    year: raw.year,
    isbn: raw.isbn,
    tags: raw.tags || [],
    description: raw.description,
    coverUrl: raw.coverUrl,
    // PUBLIC_INTERFACE
    titleFor(lang = 'en') {
      /** Return localized title by lang, fallback to default title. */
      return (titleTranslations && titleTranslations[lang]) || raw.title || '';
    },
    // PUBLIC_INTERFACE
    descriptionFor(lang = 'en') {
      /** Return localized description by lang, fallback to default description. */
      return (descriptionTranslations && descriptionTranslations[lang]) || raw.description || '';
    }
  };
}

// Mock data extended with translations
const mockBooksRaw = [
  {
    id: '1',
    title: 'The Ocean Between Us',
    author: 'Sarah Daniels',
    year: 2021,
    isbn: '9781234567890',
    tags: ['Fiction', 'Drama'],
    description: 'A moving tale of distance and connection set across coastal towns.',
    title_translations: {
      es: 'El Océano Entre Nosotros',
      en: 'The Ocean Between Us'
    },
    description_translations: {
      es: 'Un relato conmovedor de distancia y conexión a través de pueblos costeros.',
      en: 'A moving tale of distance and connection set across coastal towns.'
    }
  },
  {
    id: '2',
    title: 'Learning React the Modern Way',
    author: 'Alex Johnson',
    year: 2023,
    isbn: '9780987654321',
    tags: ['Technology', 'Programming'],
    description: 'Hands-on guide to building applications with modern React and hooks.',
    title_translations: {
      es: 'Aprendiendo React de Forma Moderna',
      en: 'Learning React the Modern Way'
    },
    description_translations: {
      es: 'Guía práctica para construir aplicaciones con React moderno y hooks.',
      en: 'Hands-on guide to building applications with modern React and hooks.'
    }
  },
  {
    id: '3',
    title: 'Seas and Stories',
    author: 'Maria Lopez',
    year: 2019,
    isbn: '9781111111111',
    tags: ['Adventure'],
    description: 'Short stories inspired by vast oceans and coastal cultures.',
    title_translations: {
      es: 'Mares y Historias',
      en: 'Seas and Stories'
    },
    description_translations: {
      es: 'Relatos cortos inspirados en los vastos océanos y las culturas costeras.',
      en: 'Short stories inspired by vast oceans and coastal cultures.'
    }
  }
];

const mockBooks = mockBooksRaw.map(mapBook);

/**
 * Favorites adapter: IndexedDB source of truth, mirrored to localStorage for backward compatibility.
 */
const FAV_KEY = 'favorites';

// PUBLIC_INTERFACE
export function readFavorites() {
  /** Return an array of favorite book IDs from IndexedDB (async not allowed in tests that import; provide sync mirror). */
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [];
  } catch {
    return [];
  }
}

async function writeFavoritesMirrorFromDb() {
  const all = await dbGetFavorites();
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(all));
    window.dispatchEvent(new StorageEvent('storage', { key: FAV_KEY, newValue: JSON.stringify(all) }));
  } catch {}
}

// PUBLIC_INTERFACE
export function toggleFavorite(bookId) {
  /**
   * Toggle a book in favorites.
   * - If online (best-effort), enqueue action and optimistically update DB + mirror.
   * - If offline, enqueue and update DB + mirror; will sync later.
   * Returns updated list (from localStorage mirror).
   */
  const id = String(bookId);
  const current = readFavorites();
  const exists = current.includes(id);
  const nextIsFav = !exists;

  // enqueue for sync regardless of connectivity
  queueToggleFavorite(id, nextIsFav).catch(() => {});

  // update local DB immediately (optimistic)
  (async () => {
    if (nextIsFav) await dbAddFavorite(id);
    else await dbRemoveFavorite(id);
    await writeFavoritesMirrorFromDb();
  })();

  // optimistic mirror result
  const next = nextIsFav ? [...current, id] : current.filter((x) => x !== id);
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage', { key: FAV_KEY, newValue: JSON.stringify(next) }));
  } catch {}
  return next;
}

// ----------------------- Notifications Service -----------------------
const NOTIF_KEY = 'notifications.list';
const PREF_KEY = 'notifications.preferences';

// seeded mock notifications and preferences
const defaultPreferences = {
  enableDueDate: true,
  enableNewArrival: true,
  enablePersonalized: true,
  frequency: 'immediate', // 'immediate' | 'daily'
  defaultSnooze: 60 // minutes
};

// Seed mock notifications with different types
function seedNotificationsIfEmpty() {
  const existing = readStorage(NOTIF_KEY, []);
  if (existing.length > 0) return;

  const now = Date.now();
  const sample = [
    {
      id: `n-${now}-1`,
      type: 'new_arrival',
      timestamp: now - 1000 * 60 * 60,
      read: false,
      bookId: '2',
      bookTitle: 'Learning React the Modern Way'
    },
    {
      id: `n-${now}-2`,
      type: 'personalized',
      timestamp: now - 1000 * 60 * 30,
      read: false,
      bookId: '3',
      bookTitle: 'Seas and Stories'
    },
    {
      id: `n-${now}-3`,
      type: 'due_date',
      timestamp: now - 1000 * 60 * 15,
      read: false,
      dueAt: now + 1000 * 60 * 60 * 24 * 2, // 2 days from now
      bookId: '1',
      bookTitle: 'The Ocean Between Us'
    }
  ];
  writeStorage(NOTIF_KEY, sample);
}
seedNotificationsIfEmpty();

function seedPreferencesIfEmpty() {
  const prefs = readStorage(PREF_KEY, null);
  if (!prefs) {
    writeStorage(PREF_KEY, defaultPreferences);
  }
}
seedPreferencesIfEmpty();

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function fetchNotifications() {
  /** Return notifications from storage (mock), newest first. */
  const list = readStorage(NOTIF_KEY, []);
  return list
    .filter((n) => !n.snoozedUntil || n.snoozedUntil <= Date.now())
    .sort((a, b) => b.timestamp - a.timestamp);
}

// PUBLIC_INTERFACE
export function markAsRead(id) {
  /** Mark a specific notification as read. */
  const list = readStorage(NOTIF_KEY, []);
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  writeStorage(NOTIF_KEY, next);
  return true;
}

// PUBLIC_INTERFACE
export function markAllAsRead() {
  /** Mark all notifications as read. */
  const list = readStorage(NOTIF_KEY, []);
  const next = list.map((n) => ({ ...n, read: true }));
  writeStorage(NOTIF_KEY, next);
  return true;
}

// PUBLIC_INTERFACE
export function snoozeNotification(id, durationMinutes) {
  /** Snooze a notification for provided minutes. */
  const until = Date.now() + durationMinutes * 60 * 1000;
  const list = readStorage(NOTIF_KEY, []);
  const next = list.map((n) => (n.id === id ? { ...n, snoozedUntil: until } : n));
  writeStorage(NOTIF_KEY, next);
  return true;
}

// PUBLIC_INTERFACE
export function getNotificationPreferences() {
  /** Get current notification preferences from storage. */
  return readStorage(PREF_KEY, defaultPreferences) || defaultPreferences;
}

// PUBLIC_INTERFACE
export function setNotificationPreferences(prefs) {
  /** Persist notification preferences to storage. */
  const next = { ...defaultPreferences, ...(prefs || {}) };
  writeStorage(PREF_KEY, next);
  return next;
}

// Client-side scheduler to generate due date reminders periodically
let schedulerStarted = false;
function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // This ticker checks for due books approaching within 3 days and generates reminders
  const TICK_MS = 60 * 1000; // 60s
  const windowMs = 3 * 24 * 60 * 60 * 1000;

  const tick = () => {
    const prefs = getNotificationPreferences();
    if (!prefs.enableDueDate) return;

    const now = Date.now();
    const list = readStorage(NOTIF_KEY, []);
    const existingDueForBook = new Map();
    for (const n of list) {
      if (n.type === 'due_date' && n.bookId) existingDueForBook.set(n.bookId, true);
    }

    // For mock purposes, create a loan-like list using mock books with synthetic due dates
    const mockLoans = [
      { bookId: '1', bookTitle: 'The Ocean Between Us', dueAt: now + 2 * 24 * 60 * 60 * 1000 },
      { bookId: '3', bookTitle: 'Seas and Stories', dueAt: now + 1 * 24 * 60 * 60 * 1000 + 3600 * 1000 },
    ];

    const newOnes = [];
    for (const loan of mockLoans) {
      if (loan.dueAt - now <= windowMs && !existingDueForBook.get(loan.bookId)) {
        newOnes.push({
          id: `n-${now}-${loan.bookId}`,
          type: 'due_date',
          timestamp: now,
          read: false,
          dueAt: loan.dueAt,
          bookId: loan.bookId,
          bookTitle: loan.bookTitle
        });
      }
    }

    if (newOnes.length) {
      writeStorage(NOTIF_KEY, [...list, ...newOnes]);
    }
  };

  tick();
  setInterval(tick, TICK_MS);
}
startScheduler();

// --------------------------------------------------------------------
// Existing book APIs with mock fallback
async function tryRealOrMock(realCall, mock) {
  try {
    const data = await realCall();
    // Map incoming items
    if (Array.isArray(data)) return data.map(mapBook);
    return mapBook(data);
  } catch {
    // Fallback to mock data when backend is not available
    return mock;
  }
}

/**
 * When real call succeeds, persist to IndexedDB for offline.
 * On failure/offline, serve from IndexedDB before falling back to mock.
 */
// PUBLIC_INTERFACE
export async function getBooks() {
  /** Fetch list of books; uses env-driven API when available, else mock with IndexedDB cache. */
  try {
    const data = await apiFetch('/books');
    const mapped = Array.isArray(data) ? data.map(mapBook) : [];
    // Persist raw mapped objects
    await putBooks(mapped);
    return mapped;
  } catch {
    // offline or failure: try IndexedDB
    const cached = await getAllBooks();
    if (cached.length) return cached;
    // fallback to mock and cache it for future
    await putBooks(mockBooks);
    return mockBooks;
  }
}

/**
 * getBookById uses network-first, writes to cache, and falls back to DB or mock.
 */
// PUBLIC_INTERFACE
export async function getBookById(id) {
  /** Fetch a single book by id; caches in IndexedDB and serves from cache when offline. */
  try {
    const data = await apiFetch(`/books/${id}`);
    const mapped = mapBook(data);
    await putBook(mapped);
    return mapped;
  } catch {
    const cached = await dbGetBook(id);
    if (cached) return cached;
    return mockBooks.find((b) => String(b.id) === String(id)) || null;
  }
}

// ----------------------- Recommendation Services -----------------------

// PUBLIC_INTERFACE
export async function getTrendingBooks() {
  /**
   * Return trending books. Backend route (suggested):
   * GET /recommendations/trending -> [Book]
   * Mock: computed by synthetic borrow counts + recency.
   */
  const real = () => apiFetch('/recommendations/trending');
  // mock scoring: pretend borrow counts and slight recency boost
  const borrowCounts = { '1': 18, '2': 28, '3': 14 };
  const recentBoost = { '1': 3, '2': 6, '3': 1 };
  const ranked = [...mockBooks].sort((a, b) => {
    const sa = (borrowCounts[a.id] || 0) + (recentBoost[a.id] || 0);
    const sb = (borrowCounts[b.id] || 0) + (recentBoost[b.id] || 0);
    return sb - sa;
  });
  return tryRealOrMock(real, ranked);
}

// PUBLIC_INTERFACE
export async function getRecommendationsByFavorites(userId = null) {
  /**
   * Personalized recommendations using favorites.
   * Backend route (suggested):
   * GET /recommendations/by-favorites?userId=XYZ -> [Book]
   * Mock: content-based similarity by shared tags/authors, excluding favorites.
   */
  const real = () => apiFetch(userId ? `/recommendations/by-favorites?userId=${encodeURIComponent(userId)}` : '/recommendations/by-favorites');
  const favs = readFavorites();
  if (!favs.length) return [];
  const favSet = new Set(favs);
  const favoriteBooks = mockBooks.filter((b) => favSet.has(String(b.id)));
  const tagFreq = new Map();
  const authorFreq = new Map();
  for (const b of favoriteBooks) {
    (b.tags || []).forEach((t) => tagFreq.set(t, (tagFreq.get(t) || 0) + 1));
    if (b.author) authorFreq.set(b.author, (authorFreq.get(b.author) || 0) + 2);
  }
  const score = (b) => {
    if (favSet.has(String(b.id))) return -1; // exclude
    let s = 0;
    (b.tags || []).forEach((t) => { s += (tagFreq.get(t) || 0); });
    if (b.author) s += (authorFreq.get(b.author) || 0);
    return s;
  };
  const ranked = [...mockBooks].map((b) => ({ b, s: score(b) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.b);
  return tryRealOrMock(real, ranked);
}

// PUBLIC_INTERFACE
export async function getUsersAlsoBorrowed(bookId) {
  /**
   * Users-also-borrowed graph.
   * Backend route (suggested):
   * GET /recommendations/also-borrowed/:bookId -> [Book]
   * Mock: small co-borrow graph seeded here.
   */
  const real = () => apiFetch(`/recommendations/also-borrowed/${bookId}`);
  const graph = {
    '1': ['3', '2'],
    '2': ['1', '3'],
    '3': ['1']
  };
  const ids = graph[String(bookId)] || [];
  const items = ids.map((id) => mockBooks.find((b) => String(b.id) === String(id))).filter(Boolean);
  return tryRealOrMock(real, items);
}

// PUBLIC_INTERFACE
export async function getPersonalizedRecommendations(profile = {}) {
  /**
   * Generic personalized recs for a profile.
   * Backend route (suggested):
   * POST /recommendations/personalized { profile } -> [Book]
   * Mock: defer to favorites-based if available else trending.
   */
  const real = () => apiFetch('/recommendations/personalized', { method: 'POST', body: JSON.stringify(profile || {}) });
  const favs = readFavorites();
  if (favs.length) {
    return getRecommendationsByFavorites();
  }
  return getTrendingBooks();
}
