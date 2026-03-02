import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Users, FileText, TrendingUp, ArrowUpRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import './Dashboard.css';

const stats = [
  { label: 'Scans today', value: '24', icon: Activity, change: '+12%', color: 'primary' },
  { label: 'Active patients', value: '156', icon: Users, change: '+5', color: 'accent' },
  { label: 'Reports generated', value: '89', icon: FileText, change: '+18%', color: 'success' },
  { label: 'Analysis accuracy', value: '98.2%', icon: TrendingUp, change: '+0.4%', color: 'info' },
];

const recent = [
  { id: '1', patient: 'John D.', type: 'CT Chest', date: '2 min ago', status: 'Completed' },
  { id: '2', patient: 'Maria L.', type: 'MRI Brain', date: '15 min ago', status: 'Analyzing' },
  { id: '3', patient: 'Robert K.', type: 'X-Ray Spine', date: '1 hr ago', status: 'Completed' },
];

function StatSkeleton() {
  return (
    <div className="dashboard-stat card dashboard-stat-skeleton">
      <div className="dashboard-skeleton dashboard-skeleton-icon" />
      <div className="dashboard-stat-content">
        <span className="dashboard-skeleton dashboard-skeleton-label" />
        <span className="dashboard-skeleton dashboard-skeleton-value" />
        <span className="dashboard-skeleton dashboard-skeleton-change" />
      </div>
    </div>
  );
}

function RecentListSkeleton() {
  return (
    <ul className="dashboard-list">
      {[1, 2, 3].map((i) => (
        <li key={i} className="dashboard-list-item">
          <div className="dashboard-skeleton dashboard-skeleton-line" style={{ width: '70%' }} />
          <div className="dashboard-list-meta">
            <span className="dashboard-skeleton dashboard-skeleton-inline" style={{ width: 60 }} />
            <span className="dashboard-skeleton dashboard-skeleton-badge" style={{ width: 72 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-stats"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
        stats.map((s) => (
          <motion.div
            key={s.label}
            className="dashboard-stat card"
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className={`dashboard-stat-icon dashboard-stat-icon--${s.color}`}>
              <s.icon size={22} />
            </div>
            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label">{s.label}</span>
              <span className="dashboard-stat-value">{s.value}</span>
              <span className="dashboard-stat-change">{s.change}</span>
            </div>
          </motion.div>
        )))}
      </motion.div>
        <motion.section
          className="card dashboard-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="dashboard-section-header">
            <h2>Recent activity</h2>
            <Link to="/app/analysis" className="dashboard-section-link">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {loading ? (
            <RecentListSkeleton />
          ) : recent.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Scans and reports will appear here once you start using COROnet."
              actionLabel="Upload your first scan"
              actionTo="/app/upload"
            />
          ) : (
          <ul className="dashboard-list">
            {recent.map((r, i) => (
              <motion.li
                key={r.id}
                className="dashboard-list-item"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div>
                  <strong>{r.patient}</strong> — {r.type}
                </div>
                <div className="dashboard-list-meta">
                  <span>{r.date}</span>
                  <span className={`dashboard-status dashboard-status--${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
          )}
        </motion.section>

        <motion.section
          className="card dashboard-section dashboard-quick"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2>Quick actions</h2>
          <div className="dashboard-actions">
            <Link to="/app/upload" className="dashboard-action card">
              <span>Upload scan</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/analysis" className="dashboard-action card">
              <span>New analysis</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/compare" className="dashboard-action card">
              <span>Compare studies</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/app/reports" className="dashboard-action card">
              <span>View reports</span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </motion.section>
      </div>
    );
}
