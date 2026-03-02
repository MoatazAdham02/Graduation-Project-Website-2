import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FlaskConical, ArrowRight } from 'lucide-react';
import './Onboarding.css';

const steps = [
  { id: 'upload', title: 'Upload your first scan', desc: 'Go to Upload Scan and add DICOM or image files.', icon: Upload, path: '/app/upload' },
  { id: 'analysis', title: 'Try Analysis Studio', desc: 'Run AI-assisted analysis on your images.', icon: FlaskConical, path: '/app/analysis' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('coronet-onboarding-done', 'true');
      navigate('/app');
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('coronet-onboarding-done', 'true');
    navigate('/app');
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-progress">
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`onboarding-dot ${i <= step ? 'onboarding-dot-done' : ''}`}
            aria-hidden
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="onboarding-card card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <div className="onboarding-icon">
            <current.icon size={40} />
          </div>
          <h1 className="onboarding-title">{current.title}</h1>
          <p className="onboarding-desc">{current.desc}</p>
          <div className="onboarding-actions">
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              {isLast ? 'Get started' : 'Next'}
              <ArrowRight size={18} />
            </button>
            <Link to={current.path} className="btn btn-secondary">
              Go to {current.id === 'upload' ? 'Upload' : 'Analysis'}
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      <button type="button" className="onboarding-skip" onClick={handleSkip}>
        Skip for now
      </button>
    </div>
  );
}
