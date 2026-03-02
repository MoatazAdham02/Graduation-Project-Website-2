import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Zap, BarChart3, Users, FileSearch, LayoutGrid, Stethoscope, Building2, FlaskConical, Lock, Server, ShieldCheck, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import './Landing.css';

const landingStats = [
  { value: '10K+', label: 'Scans analyzed' },
  { value: '50+', label: 'Healthcare partners' },
  { value: '98%', label: 'Accuracy rate' },
];

const testimonials = [
  { quote: 'COROnet cut our report turnaround by half. The AI triage is a game-changer.', role: 'Lead Radiologist', org: 'Metro General' },
  { quote: 'Finally, one platform for our reading room and research. Seamless DICOM workflow.', role: 'Imaging Director', org: 'University Hospital' },
];

export default function Landing() {
  const { scrollY } = useScroll();
  const heroVisualY = useTransform(scrollY, [0, 400], [0, 80]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const toggleNav = () => setNavOpen((p) => !p);
  const closeNav = () => setNavOpen(false);

  return (
    <div className="landing">
      <div className="landing-bg-ambient" aria-hidden />
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="container landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-icon" aria-hidden>◉</span>
            <span>COROnet</span>
          </div>
          <div className={`landing-nav-links ${navOpen ? 'landing-nav-links-open' : ''}`} id="landing-nav-links" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) closeNav(); }}>
            <motion.a href="#features" className="landing-nav-link" whileHover={{ opacity: 1 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>Features</motion.a>
            <motion.a href="#security" className="landing-nav-link" whileHover={{ opacity: 1 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>Security</motion.a>
            <Link to="/login" className="landing-nav-login landing-nav-link">Log in</Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
              <Link to="/signup" className="btn btn-primary landing-cta-nav">
                Get started
              </Link>
            </motion.div>
          </div>
          <button type="button" className="landing-nav-toggle" aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen} aria-controls="landing-nav-links" id="landing-nav-toggle" onClick={toggleNav}>
            <span className="landing-nav-toggle-bar" />
            <span className="landing-nav-toggle-bar" />
            <span className="landing-nav-toggle-bar" />
          </button>
        </div>
      </nav>

      <main className="landing-main">
      <section className="landing-hero" aria-labelledby="landing-hero-heading">
        <div className="landing-hero-bg" aria-hidden />
        <div className="container">
          <div className="landing-hero-content">
            <motion.span
              className="landing-badge"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              AI-Powered Medical Imaging
            </motion.span>
            <motion.h1
              id="landing-hero-heading"
              className="landing-hero-title"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.06, delayChildren: 0.15 },
                },
              }}
            >
              {'Clinical-grade analysis for every scan'.split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  className="landing-hero-title-word"
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </motion.h1>
            <motion.p
              className="landing-hero-desc"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
            >
              Upload, analyze, and collaborate on medical imaging with intelligent
              tools built for healthcare teams. Fast, secure, and compliant.
            </motion.p>
            <motion.div
              className="landing-hero-actions"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65, ease: 'easeOut' }}
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                <Link to="/signup" className="btn btn-primary landing-cta">
                  Start free trial
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
              <Link to="/login" className="btn btn-secondary">
                Sign in
              </Link>
            </motion.div>
          </div>
          <motion.div
            className="landing-hero-visual"
            style={{ y: heroVisualY }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="landing-hero-visual-inner">
              <div className="landing-mock-dashboard">
              <div className="landing-mock-sidebar" />
              <div className="landing-mock-main">
                <div className="landing-mock-header" />
                <div className="landing-mock-charts">
                  <div className="landing-mock-chart landing-mock-chart-bar">
                    <div className="landing-mock-bar" style={{ height: '40%' }} />
                    <div className="landing-mock-bar" style={{ height: '70%' }} />
                    <div className="landing-mock-bar" style={{ height: '55%' }} />
                    <div className="landing-mock-bar landing-mock-bar-active" style={{ height: '90%' }} />
                    <div className="landing-mock-bar" style={{ height: '65%' }} />
                  </div>
                  <div className="landing-mock-chart landing-mock-chart-line" />
                </div>
                <div className="landing-mock-progress">
                  <div className="landing-mock-progress-fill" />
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="landing-stats" aria-label="Platform statistics">
        <div className="container">
          <div className="landing-stats-inner">
            {landingStats.map((s, i) => (
              <motion.div key={s.label} className="landing-stat" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <span className="landing-stat-value">{s.value}</span>
                <span className="landing-stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section" aria-labelledby="features-heading">
        <div className="container">
          <motion.h2
            id="features-heading"
            className="landing-section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Everything you need for medical imaging
          </motion.h2>
          <div className="landing-cards">
            {[
              { icon: Zap, title: 'Fast analysis', text: 'AI-assisted detection and segmentation in seconds.' },
              { icon: BarChart3, title: 'Analytics & reports', text: 'Trends, comparisons, and exportable reports.' },
              { icon: Users, title: 'Team collaboration', text: 'Share cases, annotate, and discuss with colleagues.' },
              { icon: Shield, title: 'Secure & compliant', text: 'HIPAA-ready infrastructure and encryption.' },
              { icon: FileSearch, title: 'DICOM support', text: 'Full DICOM workflow with PACS integration.' },
              { icon: LayoutGrid, title: 'Multi-modality', text: 'CT, MRI, X-ray, and more in one platform.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="landing-card card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.12, ease: 'easeOut' }}
                whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15)' }}
                whileTap={{ scale: 0.99 }}
              >
                <motion.div
                  className="landing-card-icon"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 25 }}
                >
                  <item.icon size={24} />
                </motion.div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="landing-section landing-section-alt" aria-labelledby="security-heading">
        <div className="container">
          <motion.h2 id="security-heading" className="landing-section-title" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>Security & compliance</motion.h2>
          <p className="landing-section-desc">Enterprise-grade security so you can focus on patient care.</p>
          <div className="landing-cards landing-cards-three">
            {[
              { icon: Lock, title: 'Encryption', text: 'Data encrypted at rest and in transit with AES-256 and TLS 1.3.' },
              { icon: ShieldCheck, title: 'HIPAA ready', text: 'BAA available. Access controls, audit logs, and policy enforcement.' },
              { icon: Server, title: 'Audit & compliance', text: 'Full audit trails and support for SOC 2 and regional requirements.' },
            ].map((item, i) => (
              <motion.div key={item.title} className="landing-card card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15)' }} whileTap={{ scale: 0.99 }}>
                <motion.div className="landing-card-icon" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring', stiffness: 700, damping: 25 }}><item.icon size={24} /></motion.div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-testimonials" aria-labelledby="testimonials-heading">
        <div className="container">
          <motion.h2 id="testimonials-heading" className="landing-section-title" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>Trusted by healthcare teams</motion.h2>
          <div className="landing-testimonials-grid">
            {testimonials.map((t, i) => (
              <motion.blockquote key={i} className="landing-testimonial card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p className="landing-testimonial-quote">"{t.quote}"</p>
                <footer className="landing-testimonial-footer"><strong>{t.role}</strong>, {t.org}</footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="landing-section landing-section-alt" aria-labelledby="workflow-heading">
        <div className="container">
          <motion.h2 id="workflow-heading" className="landing-section-title" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Built for your workflow
          </motion.h2>
          <p className="landing-section-desc">
            From reading rooms to research labs—COROnet scales with your needs.
          </p>
          <div className="landing-cards landing-cards-three">
            {[
              { icon: Stethoscope, title: 'Radiologists', text: 'Streamlined reading lists, hanging protocols, and AI triage.' },
              { icon: Building2, title: 'Clinics & hospitals', text: 'Deploy across departments with centralized management.' },
              { icon: FlaskConical, title: 'Research', text: 'Export datasets, run studies, and integrate with your pipeline.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="landing-card card landing-card-workflow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.12, ease: 'easeOut' }}
                whileHover={{ y: -4, scale: 1.02, boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15)' }}
                whileTap={{ scale: 0.99 }}
              >
                <motion.div
                  className="landing-card-icon"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 25 }}
                >
                  <item.icon size={24} />
                </motion.div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta-section">
        <div className="container">
          <motion.div className="landing-cta-box" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="landing-cta-box-title">Ready to get started?</h2>
            <p className="landing-cta-box-desc">Join healthcare teams using COROnet for clinical-grade imaging analysis.</p>
            <Link to="/signup" className="btn btn-primary landing-cta">Start free trial <ArrowRight size={18} /></Link>
          </motion.div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="landing-footer-inner">
            <span>© COROnet. For clinical use only.</span>
            <div className="landing-footer-links">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {showBackToTop && (
        <motion.a href="#" className="landing-back-to-top" aria-label="Back to top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <ArrowUp size={20} />
        </motion.a>
      )}
      </main>
    </div>
  );
}
