import { Heart, Scan, Shield } from 'lucide-react';

export default function AuthHero() {
  return (
    <div className="auth-hero" aria-hidden>
      <div className="auth-hero-content">
        <div className="auth-hero-logo">
          <Heart size={36} strokeWidth={2} />
        </div>
        <h2 className="auth-hero-title">COROnet</h2>
        <p className="auth-hero-tagline">Clinical imaging workspace</p>
        <ul className="auth-hero-list">
          <li>
            <Scan size={18} aria-hidden />
            <span>DICOM viewing &amp; analysis tools</span>
          </li>
          <li>
            <Shield size={18} aria-hidden />
            <span>Built for secure hospital workflows</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
