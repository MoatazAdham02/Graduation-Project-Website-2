import { motion } from 'framer-motion';
import { HelpCircle, Book, MessageCircle, Mail, Upload, FileText, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Help.css';

const topics = [
  { icon: Book, title: 'Documentation', desc: 'Guides and API reference.' },
  { icon: MessageCircle, title: 'Contact support', desc: 'Chat with our team.' },
  { icon: Mail, title: 'Email support', desc: 'support@coronet.app' },
];

const helpSections = [
  {
    id: 'uploading',
    icon: Upload,
    title: 'Uploading scans',
    content: 'Go to Upload Scan from the sidebar or Dashboard quick actions. Drag and drop DICOM (.dcm), NIfTI (.nii, .nii.gz), or image files (.jpg, .png). Supported studies are processed automatically and appear in your worklist. Use the file picker if you prefer to browse.',
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Reading reports',
    content: 'Open the Reports page to see all generated reports. Click a report to view details and export to PDF. You can filter by date, patient, or modality. AI findings are highlighted; always review and verify with your clinical judgment.',
  },
  {
    id: 'sharing',
    icon: Share2,
    title: 'Sharing a case',
    content: 'From a case or the Share Case page, click Share to generate a secure link or send an email invite. You can set an expiration time and allow or restrict downloads. Recipients need a COROnet account or a one-time access link depending on your settings.',
  },
];

export default function Help() {
  return (
    <div className="help-page">
      <motion.div
        className="help-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="help-hero-icon">
          <HelpCircle size={40} />
        </div>
        <h1>How can we help?</h1>
        <p>Find documentation, contact support, or explore common questions.</p>
        <input
          type="search"
          placeholder="Search help articles..."
          className="input help-search"
        />
      </motion.div>

      <motion.div
        className="help-grid"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {topics.map((t) => (
          <motion.a
            key={t.title}
            href="#"
            className="card help-card"
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="help-card-icon">
              <t.icon size={24} />
            </div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
          </motion.a>
        ))}
      </motion.div>

      <motion.section
        className="help-sections"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="help-sections-title">Getting started</h2>
        {helpSections.map((s) => (
          <div key={s.id} className="card help-section-card">
            <div className="help-section-icon">
              <s.icon size={22} />
            </div>
            <div>
              <h3>{s.title}</h3>
              <p>{s.content}</p>
            </div>
          </div>
        ))}
      </motion.section>

      <div className="help-footer-grid">
      <motion.section
        className="card help-faq"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Frequently asked</h2>
        <p className="help-shortcuts-hint">
          <button type="button" className="help-shortcuts-btn" onClick={() => window.dispatchEvent(new Event('open-keyboard-shortcuts'))}>
            View keyboard shortcuts
          </button>
          {' '}— Press <kbd>?</kbd> anywhere to open the shortcuts panel.
        </p>
        <dl className="help-faq-list">
          <dt>How do I upload a DICOM study?</dt>
          <dd>Go to Upload Scan and drag files or use the file picker. We support .dcm, .nii, and common image formats.</dd>
          <dt>Is my data secure?</dt>
          <dd>Yes. All data is encrypted in transit and at rest. We are HIPAA compliant and do not train models on your data.</dd>
          <dt>Can I share a case with a colleague?</dt>
          <dd>Use Share Case to generate a link or send an email invite. You can set expiration and download permissions.</dd>
        </dl>
      </motion.section>

      <motion.section
        className="card help-changelog"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2>What&apos;s new</h2>
        <ul className="help-changelog-list">
          <li><strong>v1.2.0</strong> — Search page. Toasts, confirm dialogs, offline banner.</li>
          <li><strong>v1.1.0</strong> — Keyboard shortcuts panel. Status page.</li>
          <li><strong>v1.0.0</strong> — Initial release. Upload, analysis, reports, compare, and sharing.</li>
        </ul>
        <p className="help-status-link">
          <Link to="/app/status">View system status</Link>
        </p>
      </motion.section>
      </div>
    </div>
  );
}
