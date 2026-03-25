import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Users, FileText, TrendingUp, ArrowUpRight } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'coronet-token';

type ScanItem = {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
  patientName: string;
  studyDate: string;
  modality: string;
};

function timeAgo(dateInput: string) {
  const ts = new Date(dateInput).getTime();
  if (Number.isNaN(ts)) return 'just now';
  const diff = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

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
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);

  const fetchScans = async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/scan`, {
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error('Unable to load activity stream');
      }
      const data = (await res.json()) as ScanItem[];
      setScans(Array.isArray(data) ? data : []);
      setActivityError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setActivityError(err instanceof Error ? err.message : 'Unable to load activity stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchScans(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchScans();
    }, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const studiesToday = scans.filter((s) => new Date(s.createdAt).getTime() >= startOfToday.getTime()).length;
    const activePatients = new Set(
      scans.map((s) => (s.patientName || '').trim()).filter(Boolean)
    ).size;
    const echoScans = scans.filter((s) => s.modality?.toLowerCase().includes('echo')).length;

    return [
      { label: 'Cardiac studies today', value: String(studiesToday), icon: Activity, change: 'live', color: 'primary' },
      { label: 'Active patients', value: String(activePatients), icon: Users, change: 'from scans', color: 'accent' },
      { label: 'Echo studies uploaded', value: String(echoScans), icon: FileText, change: 'auto-updating', color: 'success' },
      { label: 'Total scans', value: String(scans.length), icon: TrendingUp, change: 'refreshes every 10s', color: 'info' },
    ];
  }, [scans]);

  const recent = useMemo(
    () => scans.slice(0, 8).map((s) => ({
      id: s.id,
      patient: s.patientName || 'Unknown patient',
      type: s.modality || 'DICOM study',
      date: timeAgo(s.createdAt),
      status: 'Uploaded',
    })),
    [scans]
  );

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
      <div className="dashboard-grid">
        <motion.section
          className="card dashboard-section dashboard-section--main"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="dashboard-section-header">
            <h2>Recent activity</h2>
            <Link to="/app/upload" className="dashboard-section-link">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          <p className="dashboard-last-login">Live stream: updates every 10 seconds</p>
          {activityError && <p className="dashboard-error">{activityError}</p>}
          {loading ? (
            <RecentListSkeleton />
          ) : recent.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Recent uploads will appear here in real time."
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
    </div>
    );
}
