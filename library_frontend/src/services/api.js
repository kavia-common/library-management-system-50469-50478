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

const mockBooks = [
  {
    id: '1',
    title: 'The Ocean Between Us',
    author: 'Sarah Daniels',
    year: 2021,
    isbn: '9781234567890',
    tags: ['Fiction', 'Drama'],
    description: 'A moving tale of distance and connection set across coastal towns.',
  },
  {
    id: '2',
    title: 'Learning React the Modern Way',
    author: 'Alex Johnson',
    year: 2023,
    isbn: '9780987654321',
    tags: ['Technology', 'Programming'],
    description: 'Hands-on guide to building applications with modern React and hooks.',
  },
  {
    id: '3',
    title: 'Seas and Stories',
    author: 'Maria Lopez',
    year: 2019,
    isbn: '9781111111111',
    tags: ['Adventure'],
    description: 'Short stories inspired by vast oceans and coastal cultures.',
  }
];

async function tryRealOrMock(realCall, mock) {
  try {
    return await realCall();
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
