import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './LoadingBar.css';

export default function LoadingBar() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="loading-bar" role="progressbar" aria-label="Loading">
      <div className="loading-bar-fill" />
    </div>
  );
}
