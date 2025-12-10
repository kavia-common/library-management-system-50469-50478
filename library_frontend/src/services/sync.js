/**
 * PUBLIC_INTERFACE
 * Offline Queue and Sync manager.
 * Records user actions while offline and flushes on reconnect.
 * If REACT_APP_API_BASE is absent, simulates sync locally.
 */

import { enqueueAction, listPending, removePending, getFavorites, addFavorite, removeFavorite, setMeta, getMeta } from '../storage/db';
import { readFavorites as lsReadFavorites } from './api';

const hasBackend = !!(process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL);

// PUBLIC_INTERFACE
export function isOnline() {
  /** Returns current online status using navigator.onLine. */
  return typeof navigator !== 'undefined' ? !!navigator.onLine : true;
}

// PUBLIC_INTERFACE
export function onConnectivityChange(cb) {
  /** Subscribe to online/offline events. Returns unsubscribe. */
  const online = () => cb(true);
  const offline = () => cb(false);
  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  return () => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
  };
}

// PUBLIC_INTERFACE
export async function initializeFavoritesMigration() {
  /** Migrate localStorage favorites to IndexedDB once. */
  const done = await getMeta('favorites.migrated', false);
  if (done) return;
  // Read from localStorage
  const ids = lsReadFavorites();
  for (const id of ids) {
    await addFavorite(id);
  }
  await setMeta('favorites.migrated', true);
}

// PUBLIC_INTERFACE
export async function queueToggleFavorite(bookId, nextIsFav) {
  /** Enqueue toggle favorite operation with idempotency key. */
  const action = {
    type: 'toggleFavorite',
    payload: { id: String(bookId), isFav: !!nextIsFav },
    ts: Date.now(),
    key: `fav:${String(bookId)}:${nextIsFav ? '1' : '0'}`,
  };
  return enqueueAction(action);
}

// PUBLIC_INTERFACE
export async function flushQueue(api) {
  /**
   * Attempt to flush pending actions.
   * api must provide: toggleFavoriteRemote(id, isFav) when backend is present.
   */
  const pending = await listPending();
  if (!pending.length) return { flushed: 0 };
  let okCount = 0;

  for (const item of pending) {
    try {
      if (item.type === 'toggleFavorite') {
        const { id, isFav } = item.payload || {};
        if (hasBackend && api?.toggleFavoriteRemote) {
          await api.toggleFavoriteRemote(id, isFav);
        } else {
          // Local reconcile
          if (isFav) await addFavorite(id);
          else await removeFavorite(id);
        }
        await removePending(item.id);
        okCount += 1;
      }
    } catch {
      // Leave in queue and stop processing to retry later
      break;
    }
  }
  return { flushed: okCount };
}

// Automatic listener to flush when back online
let autoStarted = false;
// PUBLIC_INTERFACE
export function startAutoSync(api) {
  /** Start automatic background sync on reconnect. */
  if (autoStarted) return;
  autoStarted = true;
  onConnectivityChange(async (online) => {
    if (online) {
      await flushQueue(api);
      window.dispatchEvent(new CustomEvent('sync:flushed'));
    }
  });
}
