import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, Bell, User, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Header.css';

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Report ready', body: 'CT Chest — John Doe has been finalized.', time: '2 min ago', unread: true },
  { id: '2', title: 'Case shared', body: 'Maria G. shared a case with you.', time: '1 hr ago', unread: true },
  { id: '3', title: 'Analysis complete', body: 'AI analysis finished for MRI Brain.', time: 'Yesterday', unread: false },
];

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const { setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { confirm } = useConfirm();
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
      onConfirm: () => { setProfileOpen(false); navigate('/'); addToast('info', 'You have signed out'); },
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
                  {notifications.map((n) => (
                    <li key={n.id} className={`header-notification-item ${n.unread ? 'header-notification-unread' : ''}`}>
                      <div className="header-notification-title">{n.title}</div>
                      <div className="header-notification-body">{n.body}</div>
                      <div className="header-notification-time">{n.time}</div>
                    </li>
                  ))}
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
