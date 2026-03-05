import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './Notifications.css';

const allNotifications = [
  { id: '1', title: 'Analysis complete', message: 'CT Chest — John Doe has been processed.', time: '2 min ago', unread: true },
  { id: '2', title: 'Report ready', message: 'MRI Brain report is available for download.', time: '1 hr ago', unread: true },
  { id: '3', title: 'Case shared', message: 'You were added to case #4521.', time: 'Yesterday', unread: false },
  { id: '4', title: 'Upload complete', message: 'CT Abdomen — 120 slices uploaded.', time: '2 days ago', unread: false },
  { id: '5', title: 'Report ready', message: 'X-Ray Spine — Robert K. finalized.', time: '3 days ago', unread: false },
];

const PAGE_SIZE = 3;

export default function Notifications() {
  const [notifications, setNotifications] = useState(allNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { addToast } = useToast();

  const filtered = filter === 'unread'
    ? notifications.filter((n) => n.unread)
    : notifications;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const markAllRead = () => {
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

      <motion.ul
        className="notifications-list"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {filtered.length === 0 ? (
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
                <button type="button" className="notification-btn" title="Mark read">
                  <Check size={18} />
                </button>
              )}
              <button type="button" className="notification-btn" title="Delete">
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
