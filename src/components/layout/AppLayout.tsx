import { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import KeyboardShortcuts from './KeyboardShortcuts';
import { usePageTitle } from '../../hooks/usePageTitle';
import './AppLayout.css';

type LayoutContextValue = { sidebarCollapsed: boolean; setSidebarCollapsed: (v: boolean) => void };
const LayoutContext = createContext<LayoutContextValue | null>(null);
export function useLayout() { return useContext(LayoutContext)!; }

export default function AppLayout() {
  const { title, subtitle } = usePageTitle();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      <div className={`app-layout ${sidebarCollapsed ? 'app-layout-sidebar-collapsed' : ''}`}>
        <Sidebar />
        <div className="app-main">
          <Header title={title} subtitle={subtitle} />
          <motion.main
            id="main-content"
            className="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Breadcrumbs />
            <Outlet />
          </motion.main>
          <KeyboardShortcuts />
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
