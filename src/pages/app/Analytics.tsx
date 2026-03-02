import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import './Analytics.css';

const metrics = [
  { label: 'Total scans', value: '1,247', change: '+12%', trend: 'up' },
  { label: 'Avg. analysis time', value: '4.2s', change: '-8%', trend: 'down' },
  { label: 'Reports generated', value: '892', change: '+24%', trend: 'up' },
];

const chartData = [40, 65, 45, 80, 55, 70, 60, 85, 72, 78];

export default function Analytics() {
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
            <span className={`analytics-metric-change analytics-metric-change--${m.trend}`}>
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
          <select className="input analytics-chart-select">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
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
        <ul className="analytics-activity-list">
          {[
            { action: 'CT scan analyzed', time: '2 min ago' },
            { action: 'Report exported', time: '15 min ago' },
            { action: 'Case shared', time: '1 hr ago' },
          ].map((a, i) => (
            <li key={i}>
              <Activity size={16} />
              <span>{a.action}</span>
              <span className="analytics-activity-time">{a.time}</span>
            </li>
          ))}
        </ul>
      </motion.section>
    </div>
  );
}
