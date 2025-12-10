let scheduled = [];

// PUBLIC_INTERFACE
export function scheduleNotification({ id, title, body, scheduleAt, data }) {
  /** Schedule a notification in mock mode (stores in-memory and logs). */
  const entry = { id, title, body, scheduleAt, data };
  scheduled.push(entry);
  try {
    // eslint-disable-next-line no-console
    console.log('[MockNotifications] Scheduled', entry);
  } catch {}
  return entry;
}

// PUBLIC_INTERFACE
export function getScheduledNotifications() {
  /** Return scheduled notifications (mock). */
  return scheduled.slice();
}
