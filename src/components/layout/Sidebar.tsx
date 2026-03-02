import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Upload,
  FlaskConical,
  FileText,
  GitCompare,
  Share2,
  PenTool,
  BarChart3,
  Shield,
  Settings,
  Bell,
  HelpCircle,
  Stethoscope,
  LogOut,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/patients', icon: Users, label: 'Patients' },
  { to: '/app/upload', icon: Upload, label: 'Upload Scan' },
  { to: '/app/analysis', icon: FlaskConical, label: 'Analysis Studio' },
  { to: '/app/reports', icon: FileText, label: 'Reports' },
  { to: '/app/compare', icon: GitCompare, label: 'Compare' },
  { to: '/app/share', icon: Share2, label: 'Share Case' },
  { to: '/app/annotation', icon: PenTool, label: 'Annotation' },
  { to: '/app/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/app/admin', icon: Shield, label: 'Admin' },
];

const bottomItems = [
  { to: '/app/settings', icon: Settings, label: 'Settings' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/help', icon: HelpCircle, label: 'Help' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Stethoscope size={28} strokeWidth={2} />
        </div>
        <span className="sidebar-title">COROnet</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
            end={item.to === '/app'}
          >
            {({ isActive }) => (
              <>
                <motion.span
                  className="sidebar-link-icon"
                  initial={false}
                  animate={{ scale: isActive ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon size={20} strokeWidth={2} />
                </motion.span>
                <span className="sidebar-link-label">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link sidebar-link-bottom ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <item.icon size={20} strokeWidth={2} />
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="sidebar-link sidebar-link-logout" onClick={() => navigate('/')}>
          <LogOut size={20} strokeWidth={2} />
          <span className="sidebar-link-label">Sign out</span>
        </button>
      </div>
    </motion.aside>
  );
}
