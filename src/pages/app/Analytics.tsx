import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import './Analytics.css';

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

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Analytics() {
  const [rangeDays, setRangeDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanItem[]>([]);

  const fetchScans = async (signal?: AbortSignal) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_URL}/api/scan`, {
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Unable to load analytics data');
      const data = (await res.json()) as ScanItem[];
      setScans(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unable to load analytics data');
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
    const intervalId = window.setInterval(() => {
      void fetchScans();
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  const metrics = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const prevCutoff = cutoff - 7 * 24 * 60 * 60 * 1000;
    const last7 = scans.filter((s) => new Date(s.createdAt).getTime() >= cutoff).length;
    const previous7 = scans.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= prevCutoff && t < cutoff;
    }).length;
    const trendDelta = last7 - previous7;
    const trendPrefix = trendDelta > 0 ? '+' : '';
    const uniquePatients = new Set(
      scans.map((s) => (s.patientName || '').trim()).filter(Boolean)
    ).size;
    const avgSizeMb =
      scans.length > 0 ? scans.reduce((acc, s) => acc + (s.size || 0), 0) / scans.length / (1024 * 1024) : 0;

    return [
      { label: 'Total scans', value: String(scans.length), change: `${trendPrefix}${trendDelta} this week`, trend: trendDelta >= 0 ? 'up' : 'down' },
      { label: 'Active patients', value: String(uniquePatients), change: 'from uploaded scans', trend: 'up' },
      { label: 'Avg. file size', value: `${avgSizeMb.toFixed(1)} MB`, change: 'live from uploads', trend: 'up' },
    ];
  }, [scans]);

  const chartData = useMemo(() => {
    const now = new Date();
    const buckets: number[] = [];
    for (let i = rangeDays - 1; i >= 0; i -= 1) {
      const dayStart = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = scans.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      buckets.push(count);
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((count) => Math.round((count / max) * 100));
  }, [rangeDays, scans]);

  const recentActivity = useMemo(
    () =>
      scans.slice(0, 6).map((s) => ({
        id: s.id,
        action: `${s.modality || 'DICOM'} uploaded for ${s.patientName || 'Unknown patient'}`,
        time: timeAgo(s.createdAt),
      })),
    [scans]
  );

  return (
    <div className="analytics-page">
      <motion.div
        className="analytics-metrics"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {metrics.map((m) => (
          <motion.div
            key={m.label}
            className="card analytics-metric"
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <span className="analytics-metric-label">{m.label}</span>
            <span className="analytics-metric-value">{m.value}</span>
            <span className={`analytics-metric-change analytics-metric-change--${m.trend as 'up' | 'down'}`}>
              {m.change}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.section
        className="card analytics-chart-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="analytics-chart-header">
          <h2>Scans over time</h2>
          <select
            className="input analytics-chart-select"
            value={String(rangeDays)}
            onChange={(e) => setRangeDays(Number(e.target.value))}
          >
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <p className="analytics-chart-note">Live data from scan uploads, refreshed every 10 seconds.</p>
        <div className="analytics-chart">
          {chartData.map((h, i) => (
            <motion.div
              key={i}
              className="analytics-chart-bar-wrap"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ delay: 0.3 + i * 0.03, duration: 0.4 }}
            >
              <div
                className="analytics-chart-bar"
                style={{ height: `${h}%` }}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="card analytics-activity"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2>Recent activity</h2>
        {error && <p className="analytics-error">{error}</p>}
        {loading ? (
          <p className="analytics-loading">Loading analytics…</p>
        ) : recentActivity.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Upload scans to start seeing live analytics activity."
            actionLabel="Upload scan"
            actionTo="/app/upload"
          />
        ) : (
          <ul className="analytics-activity-list">
            {recentActivity.map((a) => (
              <li key={a.id}>
                <Activity size={16} />
                <span>{a.action}</span>
                <span className="analytics-activity-time">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    </div>
  );
}
