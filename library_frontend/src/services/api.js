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

// PUBLIC_INTERFACE
export async function getBooks() {
  /** Fetch list of books; uses env-driven API when available, else mock. */
  return tryRealOrMock(
    () => apiFetch('/books'),
    mockBooks
  );
}

// PUBLIC_INTERFACE
export async function getBookById(id) {
  /** Fetch a single book by id; env API or mock. */
  const real = () => apiFetch(`/books/${id}`);
  const mock = mockBooks.find((b) => String(b.id) === String(id));
  return tryRealOrMock(real, mock);
}
