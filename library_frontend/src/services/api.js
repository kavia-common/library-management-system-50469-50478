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
