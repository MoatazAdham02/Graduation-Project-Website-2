import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

const pathLabels: Record<string, string> = {
  'app': 'App',
  'patients': 'Patients',
  'upload': 'Upload Scan',
  'analysis': 'Analysis Studio',
  'reports': 'Reports',
  'compare': 'Compare',
  'share': 'Share Case',
  'analytics': 'Analytics',
  'admin': 'Admin',
  'settings': 'Settings',
  'notifications': 'Notifications',
  'help': 'Help',
  'search': 'Search',
  'status': 'Status',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = segment === 'app' ? 'Dashboard' : (pathLabels[segment] ?? segment);
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol className="breadcrumbs-list">
        {crumbs.map(({ path, label, isLast }) => (
          <li key={path} className="breadcrumbs-item">
            {!isLast ? (
              <>
                <Link to={path} className="breadcrumbs-link">{label}</Link>
                <ChevronRight size={14} className="breadcrumbs-sep" aria-hidden />
              </>
            ) : (
              <span className="breadcrumbs-current" aria-current="page">{label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
