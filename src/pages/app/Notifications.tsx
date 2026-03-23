import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  getReadScanNotificationIds,
  markScanNotificationsRead,
  subscribeScanNotificationReadChanges,
} from '../../lib/notificationReadState';
import './Notifications.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'coronet-token';

type ScanItem = {
  id: string;
  originalName: string;
  createdAt: string;
  patientName: string;
  modality: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const PAGE_SIZE = 3;

function timeAgo(dateInput: string) {
  const ts = new Date(dateInput).getTime();
  if (Number.isNaN(ts)) return 'just now';
  const diff = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { addToast } = useToast();

  const mapScansToNotifications = (data: ScanItem[]): NotificationItem[] => {
    const readIds = getReadScanNotificationIds();
    return (Array.isArray(data) ? data : []).map((scan) => {
      const id = String(scan.id);
      return {
        id,
        title: 'Upload complete',
        message: `${scan.modality || 'DICOM'} — ${scan.patientName || 'Unknown patient'} (${scan.originalName}) uploaded.`,
        time: timeAgo(scan.createdAt),
        unread: !readIds.has(id),
      };
    });
  };

  const fetchNotifications = async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/scan`, {
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Unable to load notifications');
      const data = (await res.json()) as ScanItem[];
      setNotifications(mapScansToNotifications(data));
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchNotifications(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => subscribeScanNotificationReadChanges(() => {
    setNotifications((prev) => {
      const readIds = getReadScanNotificationIds();
      return prev.map((n) => ({ ...n, unread: !readIds.has(n.id) }));
    });
  }), []);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !hiddenIds.includes(n.id)),
    [hiddenIds, notifications]
  );

  const filtered = filter === 'unread'
    ? visibleNotifications.filter((n) => n.unread)
    : visibleNotifications;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const markAllRead = () => {
    // Persist immediately (sync) so polling fetch can't overwrite before localStorage updates.
    markScanNotificationsRead(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    addToast('success', 'All notifications marked as read');
  };
  return (
    <div className="notifications-page">
      <motion.div
        className="notifications-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="notifications-header-icon">
          <Bell size={24} />
        </div>
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on your analyses and shared cases.</p>
        </div>
      </motion.div>

      <div className="notifications-actions">
        <select
          className="input notifications-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
        >
          <option value="all">All</option>
          <option value="unread">Unread only</option>
        </select>
        <button type="button" className="btn btn-ghost" onClick={markAllRead}>
          Mark all as read
        </button>
      </div>
      {error && <p className="notifications-error">{error}</p>}

      <motion.ul
        className="notifications-list"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {loading ? (
          <li className="notifications-empty">Loading notifications...</li>
        ) : filtered.length === 0 ? (
          <li className="notifications-empty">No notifications.</li>
        ) : (
          visible.map((n) => (
          <motion.li
            key={n.id}
            className={`card notification-item ${n.unread ? 'notification-item-unread' : ''}`}
            variants={{
              hidden: { opacity: 0, x: -8 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <div className="notification-dot" />
            <div className="notification-body">
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <span className="notification-time">{n.time}</span>
            </div>
            <div className="notification-actions">
              {n.unread && (
                <button
                  type="button"
                  className="notification-btn"
                  title="Mark read"
                  onClick={() => {
                    markScanNotificationsRead([n.id]);
                    setNotifications((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                    );
                  }}
                >
                  <Check size={18} />
                </button>
              )}
              <button
                type="button"
                className="notification-btn"
                title="Delete"
                onClick={() => {
                  setHiddenIds((prev) => [...prev, n.id]);
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
            </motion.li>
          ))
        )}
      </motion.ul>
      {hasMore && filtered.length > 0 && (
        <div className="notifications-load-more">
          <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
