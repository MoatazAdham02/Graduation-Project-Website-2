import { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Square, Circle, Type, Eraser } from 'lucide-react';
import './Annotation.css';

const tools = [
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export default function Annotation() {
  const [activeTool, setActiveTool] = useState('rect');

  return (
    <div className="annotation-page">
      <div className="annotation-layout">
        <motion.aside
          className="card annotation-toolbar"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="annotation-toolbar-header">
            <PenTool size={20} />
            <span>Tools</span>
          </div>
          <div className="annotation-tools">
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`annotation-tool ${activeTool === t.id ? 'annotation-tool-active' : ''}`}
                onClick={() => setActiveTool(t.id)}
                title={t.label}
              >
                <t.icon size={20} />
              </button>
            ))}
          </div>
          <div className="annotation-colors">
            <span className="annotation-label">Color</span>
            <div className="annotation-color-grid">
              {['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7', '#7c3aed'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    className="annotation-color-swatch"
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                )
              )}
            </div>
          </div>
          <div className="annotation-opacity">
            <label className="label">Opacity</label>
            <input type="range" min="0" max="100" defaultValue="80" className="annotation-slider" />
          </div>
        </motion.aside>

        <motion.div
          className="card annotation-canvas-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="annotation-canvas">
            <div className="annotation-canvas-placeholder">
              Load a scan to annotate
            </div>
          </div>
        </motion.div>

        <motion.aside
          className="card annotation-list"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <h3>Annotations</h3>
          <p className="annotation-list-empty">No annotations yet. Draw on the canvas.</p>
        </motion.aside>
      </div>
    </div>
  );
}
