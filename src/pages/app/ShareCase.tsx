import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Link, Mail, Copy, Check } from 'lucide-react';
import './ShareCase.css';

export default function ShareCase() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const shareUrl = 'https://coronet.app/case/abc123';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-page">
      <motion.div
        className="card share-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="share-header">
          <div className="share-icon-wrap">
            <Share2 size={28} />
          </div>
          <h2>Share this case</h2>
          <p>Anyone with the link can view (read-only). Share securely with your team.</p>
        </div>

        <div className="share-link-section">
          <label className="label">Link</label>
          <div className="share-link-wrap">
            <Link size={18} className="share-link-icon" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="input share-link-input"
            />
            <button
              type="button"
              className="btn btn-secondary share-copy"
              onClick={handleCopy}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="share-divider">
          <span>or send via email</span>
        </div>

        <div className="share-email-section">
          <label className="label">Email address</label>
          <div className="share-email-wrap">
            <Mail size={18} className="share-email-icon" />
            <input
              type="email"
              placeholder="colleague@hospital.org"
              className="input share-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="button" className="btn btn-primary">
              Send invite
            </button>
          </div>
        </div>

        <div className="share-permissions">
          <h4>Permissions</h4>
          <label className="share-check">
            <input type="checkbox" defaultChecked />
            <span>Allow viewers to download</span>
          </label>
          <label className="share-check">
            <input type="checkbox" />
            <span>Expire link in 7 days</span>
          </label>
        </div>
      </motion.div>
    </div>
  );
}
