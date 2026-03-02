import { motion } from 'framer-motion';
import { Users, Shield, Settings, Key } from 'lucide-react';
import './Admin.css';

const sections = [
  { icon: Users, title: 'User management', desc: 'Invite and manage team members and roles.' },
  { icon: Shield, title: 'Security & audit', desc: 'View audit logs and security settings.' },
  { icon: Settings, title: 'Organization', desc: 'Organization profile and preferences.' },
  { icon: Key, title: 'API & integrations', desc: 'API keys and third-party integrations.' },
];

export default function Admin() {
  return (
    <div className="admin-page">
      <motion.h2
        className="admin-title"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Administration
      </motion.h2>
      <p className="admin-desc">
        Manage your organization, users, and security settings. Admin access only.
      </p>

      <div className="admin-grid">
        {sections.map((s, i) => (
          <motion.a
            key={s.title}
            href="#"
            className="card admin-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="admin-card-icon">
              <s.icon size={24} />
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
