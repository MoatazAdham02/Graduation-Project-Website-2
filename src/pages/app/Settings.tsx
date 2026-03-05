import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import './Settings.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'security'>('profile');
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const tabs = [
    { id: 'profile' as const, icon: User, label: 'Profile' },
    { id: 'notifications' as const, icon: Bell, label: 'Notifications' },
    { id: 'appearance' as const, icon: Palette, label: 'Appearance' },
    { id: 'security' as const, icon: Shield, label: 'Security' },
  ];

  return (
    <div className="settings-page">
      <div className="settings-layout">
        <motion.nav
          className="settings-nav card"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-nav-item ${activeTab === t.id ? 'settings-nav-item-active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <t.icon size={18} />
              <span>{t.label}</span>
            </button>
          ))}
        </motion.nav>

        <motion.div
          key={activeTab}
          className="card settings-content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'profile' && (
            <>
              <h2>Profile</h2>
              <div className="settings-form">
                <label className="label">Display name</label>
                <input type="text" className="input" placeholder="Dr. Jane Smith" />
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="jane@hospital.org" />
                <button type="button" className="btn btn-primary" onClick={() => addToast('success', 'Profile updated')}>Save changes</button>
              </div>
            </>
          )}
          {activeTab === 'notifications' && (
            <>
              <h2>Notifications</h2>
              <div className="settings-form">
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Email when analysis completes</span>
                </label>
                <label className="settings-toggle">
                  <input type="checkbox" defaultChecked />
                  <span>In-app notifications</span>
                </label>
                <label className="settings-toggle">
                  <input type="checkbox" />
                  <span>Weekly digest</span>
                </label>
                <button type="button" className="btn btn-primary" onClick={() => addToast('success', 'Notification preferences saved')}>Save</button>
              </div>
            </>
          )}
          {activeTab === 'appearance' && (
            <>
              <h2>Appearance</h2>
              <div className="settings-form">
                <label className="label">Theme</label>
                <select
                  className="input"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <p className="settings-hint">System follows your device preference.</p>
              </div>
            </>
          )}
          {activeTab === 'security' && (
            <>
              <h2>Security</h2>
              <div className="settings-form">
                <label className="label">Current password</label>
                <input type="password" className="input" placeholder="••••••••" />
                <label className="label">New password</label>
                <input type="password" className="input" placeholder="••••••••" />
                <button type="button" className="btn btn-primary" onClick={() => addToast('success', 'Password updated')}>Update password</button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
