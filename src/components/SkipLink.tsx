import { useEffect } from 'react';
import './SkipLink.css';

const SKIP_TARGET_ID = 'main-content';

export default function SkipLink() {
  useEffect(() => {
    const main = document.getElementById(SKIP_TARGET_ID);
    if (!main) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
        e.preventDefault();
        const skip = document.getElementById('skip-link');
        (skip as HTMLAnchorElement)?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <a
      id="skip-link"
      href={`#${SKIP_TARGET_ID}`}
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}
