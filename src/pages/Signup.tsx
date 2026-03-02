import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Stethoscope } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
          <p>Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="label">Full name</label>
          <div className="auth-input-wrap">
            <User size={18} className="auth-input-icon" />
            <input
              type="text"
              className="input auth-input"
              placeholder="Dr. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              minLength={8}
            />
          </div>

          <p className="auth-terms">
            By signing up, you agree to our <a href="#terms">Terms</a> and{' '}
            <a href="#privacy">Privacy Policy</a>.
          </p>

          <button type="submit" className="btn btn-primary auth-submit">
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>

      <Link to="/" className="auth-back">← Back to home</Link>
    </div>
  );
}
