import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  '/app': { title: 'Dashboard', subtitle: 'Overview of your activity' },
  '/app/patients': { title: 'Patients', subtitle: 'Manage patient records' },
  '/app/upload': { title: 'Upload Scan', subtitle: 'Upload medical imaging' },
  '/app/analysis': { title: 'Analysis Studio', subtitle: 'AI-powered analysis' },
  '/app/reports': { title: 'Reports', subtitle: 'View and export reports' },
  '/app/compare': { title: 'Compare', subtitle: 'Compare scans side by side' },
  '/app/share': { title: 'Share Case', subtitle: 'Collaborate with colleagues' },
  '/app/annotation': { title: 'Annotation', subtitle: 'Annotate and markup' },
  '/app/analytics': { title: 'Analytics', subtitle: 'Insights and trends' },
  '/app/admin': { title: 'Admin', subtitle: 'System administration' },
  '/app/settings': { title: 'Settings', subtitle: 'Preferences and account' },
  '/app/notifications': { title: 'Notifications', subtitle: 'Alerts and updates' },
  '/app/help': { title: 'Help', subtitle: 'Documentation and support' },
};

export function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/app/patients/') && pathname !== '/app/patients') return { title: 'Patient details', subtitle: 'View patient record' };
  if (pathname.startsWith('/app/reports/') && pathname !== '/app/reports') return { title: 'Report', subtitle: 'View report' };
  return routeTitles[pathname] ?? { title: 'COROnet', subtitle: '' };
}
