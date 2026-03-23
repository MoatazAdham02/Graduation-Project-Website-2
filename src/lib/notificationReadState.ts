/**
 * Persist which scan-derived notifications are "read" so refresh/polling/remount
 * does not flip them back to unread. Shared by Header dropdown and Notifications page.
 */
const STORAGE_KEY = 'coronet-read-scan-notification-ids';
const CHANGED_EVENT = 'coronet-read-scan-notifications-changed';

function parseIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((id) => String(id)));
  } catch {
    return new Set();
  }
}

export function getReadScanNotificationIds(): Set<string> {
  return parseIds();
}

export function isScanNotificationRead(scanId: string): boolean {
  return parseIds().has(String(scanId));
}

export function markScanNotificationsRead(ids: string[]): void {
  if (ids.length === 0) return;
  const set = parseIds();
  ids.forEach((id) => set.add(String(id)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

export function subscribeScanNotificationReadChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CHANGED_EVENT, handler);
  return () => window.removeEventListener(CHANGED_EVENT, handler);
}
