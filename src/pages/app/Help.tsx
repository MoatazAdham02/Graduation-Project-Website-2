import { motion } from 'framer-motion';
import { HelpCircle, Book, MessageCircle, Mail } from 'lucide-react';
import './Help.css';

const topics = [
  { icon: Book, title: 'Documentation', desc: 'Guides and API reference.' },
  { icon: MessageCircle, title: 'Contact support', desc: 'Chat with our team.' },
  { icon: Mail, title: 'Email support', desc: 'support@coronet.app' },
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
        className="card help-faq"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Frequently asked</h2>
        <dl className="help-faq-list">
          <dt>How do I upload a DICOM study?</dt>
          <dd>Go to Upload Scan and drag files or use the file picker. We support .dcm, .nii, and common image formats.</dd>
          <dt>Is my data secure?</dt>
          <dd>Yes. All data is encrypted in transit and at rest. We are HIPAA compliant and do not train models on your data.</dd>
          <dt>Can I share a case with a colleague?</dt>
          <dd>Use Share Case to generate a link or send an email invite. You can set expiration and download permissions.</dd>
        </dl>
      </motion.section>
    </div>
  );
}
