import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, User } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import './Reports.css';

const allReports = [
  { id: '1', title: 'CT Chest — John Doe', date: 'Mar 1, 2025', type: 'Radiology', status: 'Final' },
  { id: '2', title: 'MRI Brain — Maria G.', date: 'Feb 28, 2025', type: 'Radiology', status: 'Draft' },
  { id: '3', title: 'X-Ray Spine — Robert K.', date: 'Feb 27, 2025', type: 'Radiology', status: 'Final' },
  { id: '4', title: 'CT Abdomen — Sarah C.', date: 'Feb 26, 2025', type: 'Radiology', status: 'Final' },
  { id: '5', title: 'MRI Knee — James W.', date: 'Feb 25, 2025', type: 'Radiology', status: 'Draft' },
  { id: '6', title: 'X-Ray Hand — Emily D.', date: 'Feb 24, 2025', type: 'Radiology', status: 'Final' },
];

const PAGE_SIZE = 3;

export default function Reports() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = allReports.slice(0, visibleCount);
  const hasMore = visibleCount < allReports.length;
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
        {allReports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="Reports will appear here once analyses are completed."
            actionLabel="Upload a scan"
            actionTo="/app/upload"
          />
        ) : (
        <>
        {visible.map((r) => (
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
            <Link to={`/app/reports/${r.id}`} className="btn btn-ghost">View</Link>
          </motion.article>
        ))}
        </>
        )}
      </motion.div>
      {hasMore && allReports.length > 0 && (
        <div className="reports-load-more">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
