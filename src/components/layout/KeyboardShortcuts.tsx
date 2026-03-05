import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import './KeyboardShortcuts.css';

const shortcuts = [
  { keys: ['Ctrl', 'K'], label: 'Focus search', macKeys: ['⌘', 'K'] },
  { keys: ['?'], label: 'Show this help' },
  { keys: ['G', 'D'], label: 'Go to Dashboard' },
  { keys: ['G', 'P'], label: 'Go to Patients' },
  { keys: ['G', 'U'], label: 'Go to Upload' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setOpen((p) => !p);
        }
      }
      if (e.key === 'Escape') setOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const el = document.getElementById('header-search');
        if (el) (el as HTMLInputElement).focus();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-keyboard-shortcuts', onOpen);
    return () => window.removeEventListener('open-keyboard-shortcuts', onOpen);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const displayShortcuts = shortcuts.map((s) => ({
    ...s,
    keys: s.macKeys && isMac ? s.macKeys : s.keys,
  }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="keyboard-shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <motion.div
            className="keyboard-shortcuts-modal card"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="keyboard-shortcuts-header">
              <h3>Keyboard shortcuts</h3>
              <button type="button" className="keyboard-shortcuts-close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <ul className="keyboard-shortcuts-list">
              {displayShortcuts.map((s, i) => (
                <li key={i} className="keyboard-shortcuts-item">
                  <span className="keyboard-shortcuts-label">{s.label}</span>
                  <span className="keyboard-shortcuts-keys">
                    {s.keys.map((k, j) => (
                      <kbd key={j}>{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="keyboard-shortcuts-hint">Press ? to toggle this panel</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
