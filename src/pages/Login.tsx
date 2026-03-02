import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Stethoscope } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/app');
  };

  return (
    <div className="auth-page">
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
          <h1>COROnet</h1>
          <p>Sign in to your account</p>
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
            />
          </div>

          <label className="label">Password</label>
          <div className="auth-input-wrap">
            <Lock size={18} className="auth-input-icon" />
            <input
              type="password"
              className="input auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-options">
            <label className="auth-checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="auth-link">Forgot password?</a>
          </div>

          <button type="submit" className="btn btn-primary auth-submit">
            Sign in
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </motion.div>

      <Link to="/" className="auth-back">← Back to home</Link>
    </div>
  );
}
