import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Stethoscope } from 'lucide-react';
import AuthHero from '../components/AuthHero';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <AuthHero />
        <div className="auth-pane">
          <Link to="/" className="auth-back">
            ← Back to home
          </Link>
          <motion.div
            className="auth-card card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="auth-brand">
              <div className="auth-logo">
                <Stethoscope size={32} />
              </div>
              <h1>Check your email</h1>
              <p>If an account exists for {email}, we've sent instructions to reset your password.</p>
            </div>
            <Link to="/login" className="btn btn-primary auth-submit" style={{ display: 'block', textAlign: 'center' }}>
              Back to sign in
            </Link>
            <p className="auth-switch">
              <Link to="/signup">Create an account</Link>
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthHero />
      <div className="auth-pane">
        <Link to="/" className="auth-back">
          ← Back to home
        </Link>
        <motion.div
          className="auth-card card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
        <div className="auth-brand">
          <div className="auth-logo">
            <Stethoscope size={32} />
          </div>
          <h1>Reset password</h1>
          <p>Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="label">Email</label>
          <div className="auth-input-wrap">
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              className="input auth-input"
              placeholder="you@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
        </motion.div>
      </div>
    </div>
  );
}
