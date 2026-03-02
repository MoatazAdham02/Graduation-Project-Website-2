import { motion } from 'framer-motion';
import { FileText, Download, Calendar, User } from 'lucide-react';
import './Reports.css';

const reports = [
  { id: '1', title: 'CT Chest — John Doe', date: 'Mar 1, 2025', type: 'Radiology', status: 'Final' },
  { id: '2', title: 'MRI Brain — Maria G.', date: 'Feb 28, 2025', type: 'Radiology', status: 'Draft' },
  { id: '3', title: 'X-Ray Spine — Robert K.', date: 'Feb 27, 2025', type: 'Radiology', status: 'Final' },
];

export default function Reports() {
  return (
    <div className="reports-page">
      <div className="reports-toolbar">
        <div className="reports-filters">
          <select className="input reports-filter">
            <option>All types</option>
          </select>
          <select className="input reports-filter">
            <option>All status</option>
          </select>
        </div>
        <button type="button" className="btn btn-primary">
          <Download size={18} />
          Export
        </button>
      </div>

      <motion.div
        className="reports-list"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {reports.map((r) => (
          <motion.article
            key={r.id}
            className="card reports-card"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="reports-card-icon">
              <FileText size={24} />
            </div>
            <div className="reports-card-body">
              <h3>{r.title}</h3>
              <div className="reports-card-meta">
                <span><Calendar size={14} /> {r.date}</span>
                <span><User size={14} /> {r.type}</span>
              </div>
            </div>
            <span className={`reports-status reports-status--${r.status.toLowerCase()}`}>
              {r.status}
            </span>
            <button type="button" className="btn btn-ghost">View</button>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
}
