import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePageTitle } from '../../hooks/usePageTitle';
import './AppLayout.css';

export default function AppLayout() {
  const { title, subtitle } = usePageTitle();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header title={title} subtitle={subtitle} />
        <motion.main
          className="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
