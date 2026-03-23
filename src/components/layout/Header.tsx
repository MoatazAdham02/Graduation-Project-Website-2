import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, Bell, User, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Header.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'coronet-token';

type ScanItem = {
  id: string;
  originalName: string;
  createdAt: string;
  patientName: string;
  modality: string;
};

type HeaderNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

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

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { confirm } = useConfirm();
  const { logout } = useAuth();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  useFocusTrap(notifDropdownRef, notificationsOpen);
  useFocusTrap(profileDropdownRef, profileOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchNotifications = async (signal?: AbortSignal) => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${API_URL}/api/scan`, {
          signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = (await res.json()) as ScanItem[];
        const mapped = (Array.isArray(data) ? data : [])
          .slice(0, 6)
          .map((scan) => ({
            id: scan.id,
            title: 'Upload complete',
            body: `${scan.modality || 'DICOM'} — ${scan.patientName || 'Unknown patient'} (${scan.originalName}) uploaded.`,
            time: timeAgo(scan.createdAt),
            unread: true,
          }));
        setNotifications(mapped);
      } catch {
        // keep current notifications on transient errors
      }
    };

    const controller = new AbortController();
    void fetchNotifications(controller.signal);
    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 10000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    addToast('success', 'All notifications marked as read');
  };

  const handleSignOut = () => {
    confirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
      variant: 'danger',
      onConfirm: () => { setProfileOpen(false); logout(); navigate('/login'); addToast('info', 'You have signed out'); },
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[type="search"]') as HTMLInputElement;
    const q = input?.value?.trim() ?? '';
    navigate(q ? `/app/search?q=${encodeURIComponent(q)}` : '/app/search');
    input?.blur();
  };

  return (
    <motion.header
      className="header"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="header-left">
        <button
          type="button"
          className="header-mobile-menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <div className="header-breadcrumb">
          {title && <h1 className="header-title">{title}</h1>}
          {subtitle && <span className="header-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="header-right">
        <form
          className={`header-search-wrap ${searchFocused ? 'header-search-focused' : ''}`}
          title="Search patients and reports"
          onSubmit={handleSearchSubmit}
        >
          <Search size={18} className="header-search-icon" />
          <input
            id="header-search"
            type="search"
            placeholder="Search patients, reports..."
            className="header-search"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </form>

        <button
          type="button"
          className="header-icon-btn"
          aria-label="Notifications"
          title="Notifications"
          aria-expanded={notificationsOpen}
          aria-haspopup="true"
          onClick={() => { setNotificationsOpen((o) => !o); setProfileOpen(false); }}
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
        </button>
        <div className="header-dropdown-wrap" ref={notifRef}>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                ref={notifDropdownRef}
                className="header-dropdown header-dropdown-notifications card"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                role="menu"
                aria-label="Notifications"
              >
                <div className="header-dropdown-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button type="button" className="header-dropdown-action" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="header-notifications-list">
                  {notifications.length === 0 ? (
                    <li className="header-notification-item">
                      <div className="header-notification-body">No notifications yet.</div>
                    </li>
                  ) : (
                    notifications.map((n) => (
                      <li key={n.id} className={`header-notification-item ${n.unread ? 'header-notification-unread' : ''}`}>
                        <div className="header-notification-title">{n.title}</div>
                        <div className="header-notification-body">{n.body}</div>
                        <div className="header-notification-time">{n.time}</div>
                      </li>
                    ))
                  )}
                </ul>
                <Link to="/app/notifications" className="header-dropdown-footer" onClick={() => setNotificationsOpen(false)}>
                  View all notifications
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          className="header-icon-btn"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="header-dropdown-wrap header-avatar-wrap" ref={profileRef}>
          <button
            type="button"
            className="header-avatar"
            aria-label="Profile menu"
            title="Profile menu"
            aria-expanded={profileOpen}
            aria-haspopup="true"
            onClick={() => { setProfileOpen((o) => !o); setNotificationsOpen(false); }}
          >
            <User size={20} />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                ref={profileDropdownRef}
                className="header-dropdown header-dropdown-profile card"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                role="menu"
                aria-label="Profile menu"
              >
                <Link to="/app/settings" className="header-profile-item" onClick={() => setProfileOpen(false)}>
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <Link to="/app/settings" className="header-profile-item" onClick={() => setProfileOpen(false)}>
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  className="header-profile-item header-profile-item-logout"
                  onClick={handleSignOut}
                >
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
