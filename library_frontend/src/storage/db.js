/**
 * PUBLIC_INTERFACE
 * IndexedDB wrapper for offline caching and pending actions.
 * Stores:
 *  - books (key: id, value: book object)
 *  - favorites (key: id, value: { id: string })
 *  - pendingActions (key: uuid, value: { id, type, payload, ts, key })
 *  - metadata (key: name, value: any)
 *
 * No external deps: minimal wrapper over IndexedDB.
 */
const DB_NAME = 'library-offline';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';
const STORE_FAVORITES = 'favorites';
const STORE_PENDING = 'pendingActions';
const STORE_META = 'metadata';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    Promise.resolve(fn(store))
      .then((res) => {
        tx.oncomplete = () => resolve(res);
        tx.onerror = () => reject(tx.error);
      })
      .catch(reject);
  });
}

// PUBLIC_INTERFACE
export async function putBook(book) {
  /** Put a book object into the books store. */
  return withStore(STORE_BOOKS, 'readwrite', (s) => s.put(book));
}

// PUBLIC_INTERFACE
export async function getBook(id) {
  /** Get a book by id from IndexedDB. */
  return withStore(STORE_BOOKS, 'readonly', (s) => s.get(String(id)));
}

// PUBLIC_INTERFACE
export async function putBooks(books = []) {
  /** Bulk put books. */
  return withStore(STORE_BOOKS, 'readwrite', (s) => {
    books.forEach((b) => s.put(b));
  });
}

// PUBLIC_INTERFACE
export async function getAllBooks() {
  /** Get all books from cache. */
  return withStore(STORE_BOOKS, 'readonly', (s) => {
    return new Promise((resolve) => {
      const out = [];
      const req = s.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          out.push(cursor.value);
          cursor.continue();
        } else {
          resolve(out);
        }
      };
      req.onerror = () => resolve([]);
    });
  });
}

// PUBLIC_INTERFACE
export async function addFavorite(id) {
  /** Add favorite id to IndexedDB favorites store. */
  return withStore(STORE_FAVORITES, 'readwrite', (s) => s.put({ id: String(id) }));
}

// PUBLIC_INTERFACE
export async function removeFavorite(id) {
  /** Remove favorite id from IndexedDB favorites store. */
  return withStore(STORE_FAVORITES, 'readwrite', (s) => s.delete(String(id)));
}

// PUBLIC_INTERFACE
export async function getFavorites() {
  /** Get all favorite ids from IndexedDB. */
  return withStore(STORE_FAVORITES, 'readonly', (s) => {
    return new Promise((resolve) => {
      const ids = [];
      const req = s.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          ids.push(String(cursor.value.id));
          cursor.continue();
        } else {
          resolve(ids);
        }
      };
      req.onerror = () => resolve([]);
    });
  });
}

// PUBLIC_INTERFACE
export async function enqueueAction(action) {
  /** Enqueue a pending action { id, type, payload, ts, key }. */
  const item = { ...action, id: action.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  return withStore(STORE_PENDING, 'readwrite', (s) => s.put(item));
}

// PUBLIC_INTERFACE
export async function listPending() {
  /** List all pending actions. */
  return withStore(STORE_PENDING, 'readonly', (s) => {
    return new Promise((resolve) => {
      const out = [];
      const req = s.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          out.push(cursor.value);
          cursor.continue();
        } else {
          resolve(out.sort((a, b) => a.ts - b.ts));
        }
      };
      req.onerror = () => resolve([]);
    });
  });
}

// PUBLIC_INTERFACE
export async function removePending(id) {
  /** Remove a pending action by id. */
  return withStore(STORE_PENDING, 'readwrite', (s) => s.delete(String(id)));
}

// PUBLIC_INTERFACE
export async function setMeta(id, value) {
  /** Set metadata value by id. */
  return withStore(STORE_META, 'readwrite', (s) => s.put({ id, value }));
}

// PUBLIC_INTERFACE
export async function getMeta(id, fallback = null) {
  /** Read metadata value by id. */
  const obj = await withStore(STORE_META, 'readonly', (s) => s.get(id));
  return obj ? obj.value : fallback;
}
