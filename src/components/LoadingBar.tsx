import { useLocation } from 'react-router-dom';
import './LoadingBar.css';

export default function LoadingBar() {
  const location = useLocation();

  return (
    <div className="loading-bar" role="progressbar" aria-label="Loading">
      <div key={location.pathname} className="loading-bar-fill" />
    </div>
  );
}
