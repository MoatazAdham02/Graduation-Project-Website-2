import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, Bell, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

type HeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

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
        <div
          className={`header-search-wrap ${searchFocused ? 'header-search-focused' : ''}`}
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
        </div>

        <button type="button" className="header-icon-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="header-badge">3</span>
        </button>
        <button
          type="button"
          className="header-icon-btn"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button type="button" className="header-avatar" aria-label="Profile">
          <User size={20} />
        </button>
      </div>
    </motion.header>
  );
}
