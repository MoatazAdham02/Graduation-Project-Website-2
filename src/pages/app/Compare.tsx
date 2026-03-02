import { motion } from 'framer-motion';
import { GitCompare, Plus, Layers } from 'lucide-react';
import './Compare.css';

export default function Compare() {
  return (
    <div className="compare-page">
      <motion.div
        className="compare-layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="compare-panel card">
          <div className="compare-panel-header">
            <span>Scan A</span>
            <button type="button" className="btn btn-ghost btn-sm">Select</button>
          </div>
          <div className="compare-panel-placeholder">
            <Layers size={40} />
            <p>No scan selected</p>
          </div>
        </div>

        <div className="compare-divider">
          <GitCompare size={24} />
          <span>Compare</span>
        </div>

        <div className="compare-panel card">
          <div className="compare-panel-header">
            <span>Scan B</span>
            <button type="button" className="btn btn-ghost btn-sm">Select</button>
          </div>
          <div className="compare-panel-placeholder">
            <Layers size={40} />
            <p>No scan selected</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="compare-actions card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button type="button" className="btn btn-secondary">
          <Plus size={18} />
          Add timepoint
        </button>
        <button type="button" className="btn btn-primary">
          Run comparison
        </button>
      </motion.div>
    </div>
  );
}
