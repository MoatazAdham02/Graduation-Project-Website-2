import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import './Notifications.css';

const notifications = [
  { id: '1', title: 'Analysis complete', message: 'CT Chest — John Doe has been processed.', time: '2 min ago', unread: true },
  { id: '2', title: 'Report ready', message: 'MRI Brain report is available for download.', time: '1 hr ago', unread: true },
  { id: '3', title: 'Case shared', message: 'You were added to case #4521.', time: 'Yesterday', unread: false },
];

export default function Notifications() {
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
        <button type="button" className="btn btn-ghost">Mark all as read</button>
      </div>

      <motion.ul
        className="notifications-list"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {notifications.map((n) => (
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
        ))}
      </motion.ul>
    </div>
  );
}
