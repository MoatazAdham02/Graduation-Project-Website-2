import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, User, FileText } from 'lucide-react';
import './Search.css';

const mockPatients = [
  { id: '1', name: 'John Doe', mrn: 'MRN-001' },
  { id: '2', name: 'Maria Garcia', mrn: 'MRN-002' },
  { id: '3', name: 'Robert Kim', mrn: 'MRN-003' },
  { id: '4', name: 'Sarah Chen', mrn: 'MRN-004' },
  { id: '5', name: 'James Wilson', mrn: 'MRN-005' },
];

const mockReports = [
  { id: '1', title: 'CT Chest — John Doe' },
  { id: '2', title: 'MRI Brain — Maria G.' },
  { id: '3', title: 'CT Abdomen — Sarah C.' },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);

  useEffect(() => setQuery(q), [q]);

  const qLower = query.trim().toLowerCase();
  const patients = qLower
    ? mockPatients.filter((p) => p.name.toLowerCase().includes(qLower) || p.mrn.toLowerCase().includes(qLower))
    : [];
  const reports = qLower
    ? mockReports.filter((r) => r.title.toLowerCase().includes(qLower))
    : [];

  const hasResults = patients.length > 0 || reports.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="search-page">
      <motion.div
        className="search-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Search</h1>
        <p>Find patients and reports by name, MRN, or report title.</p>
        <div className="search-input-wrap">
          <Search size={20} className="search-input-icon" />
          <input
            type="search"
            className="input search-input"
            placeholder="Search patients, reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </motion.div>

      {!hasQuery ? (
        <motion.p className="search-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Enter a search term above to find patients and reports.
        </motion.p>
      ) : !hasResults ? (
        <motion.div className="search-empty card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>No results for &quot;{query}&quot;</p>
          <p className="search-empty-hint">Try a different term or check spelling.</p>
        </motion.div>
      ) : (
        <motion.div
          className="search-results"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {patients.length > 0 && (
            <section className="search-section">
              <h2>Patients</h2>
              <ul className="search-list">
                {patients.map((p) => (
                  <motion.li key={p.id} variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                    <Link to={`/app/patients/${p.id}`} className="search-result-card card">
                      <User size={20} />
                      <div>
                        <strong>{p.name}</strong>
                        <span>{p.mrn}</span>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
          {reports.length > 0 && (
            <section className="search-section">
              <h2>Reports</h2>
              <ul className="search-list">
                {reports.map((r) => (
                  <motion.li key={r.id} variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                    <Link to={`/app/reports/${r.id}`} className="search-result-card card">
                      <FileText size={20} />
                      <div>
                        <strong>{r.title}</strong>
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
        </motion.div>
      )}
    </div>
  );
}
