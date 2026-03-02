import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2, Layers, Sliders } from 'lucide-react';
import './AnalysisStudio.css';

export default function AnalysisStudio() {
  const [running, setRunning] = useState(false);

  return (
    <div className="analysis-page">
      <div className="analysis-layout">
        <motion.section
          className="card analysis-viewer"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="analysis-viewer-placeholder">
            <Layers size={48} />
            <p>Select a scan or upload to begin</p>
          </div>
        </motion.section>

        <motion.aside
          className="analysis-sidebar card"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <h3>Analysis parameters</h3>
          <div className="analysis-param">
            <label className="label">Model</label>
            <select className="input">
              <option>CT — Lung nodule detection</option>
              <option>MRI — Brain segmentation</option>
              <option>X-Ray — Fracture detection</option>
            </select>
          </div>
          <div className="analysis-param">
            <label className="label">Sensitivity</label>
            <div className="analysis-slider-wrap">
              <Sliders size={18} />
              <input type="range" min="0" max="100" defaultValue="75" className="analysis-slider" />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary analysis-run"
            onClick={() => setRunning(true)}
            disabled={running}
          >
            {running ? (
              <>
                <Loader2 size={18} className="spin" />
                Running analysis...
              </>
            ) : (
              <>
                <Play size={18} />
                Run analysis
              </>
            )}
          </button>

          <div className="analysis-results-preview">
            <h4>Results</h4>
            <p className="analysis-results-placeholder">No results yet.</p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
