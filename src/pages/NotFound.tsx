import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found-page" id="main-content">
      <div className="not-found-visual" aria-hidden>
        <span className="not-found-visual-ring" />
        <span className="not-found-visual-ring not-found-visual-ring--2" />
      </div>
      <motion.div
        className="not-found-card card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="not-found-icon" aria-hidden>
          <FileQuestion size={64} />
        </div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-desc">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={18} />
            Back to home
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
