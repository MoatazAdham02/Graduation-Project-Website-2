import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import './Status.css';

const statusItems = [
  { name: 'API', status: 'operational' },
  { name: 'DICOM ingestion', status: 'operational' },
  { name: 'AI analysis', status: 'operational' },
  { name: 'Report generation', status: 'operational' },
];

export default function Status() {
  return (
    <div className="status-page">
      <motion.div
        className="status-hero card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="status-hero-badge">
          <CheckCircle size={24} />
          <span>All systems operational</span>
        </div>
        <p className="status-hero-desc">No known issues. Last updated just now.</p>
      </motion.div>
      <motion.ul
        className="status-list"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {statusItems.map((item) => (
          <motion.li
            key={item.name}
            className="card status-item"
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            {item.status === 'operational' ? <CheckCircle size={20} className="status-icon status-icon--up" /> : <AlertCircle size={20} className="status-icon status-icon--down" />}
            <span className="status-name">{item.name}</span>
            <span className="status-value">{item.status}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
