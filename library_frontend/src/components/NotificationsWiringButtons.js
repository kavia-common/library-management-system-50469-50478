import React from 'react';

// This component isn't rendered in UI; it provides helper functions to dispatch events.
// For future integration if needed.
export default function NotificationsWiringButtons() {
  return null;
}

// PUBLIC_INTERFACE
export function openNotificationsCenter() {
  /** Dispatch a window event to open notifications center. */
  window.dispatchEvent(new Event('openNotifications'));
}

// PUBLIC_INTERFACE
export function openPreferencesModal() {
  /** Dispatch a window event to open preferences modal. */
  window.dispatchEvent(new Event('openPreferences'));
}
