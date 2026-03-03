import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, User } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import './Patients.css';

const mockPatients = [
  { id: '1', name: 'John Doe', mrn: 'MRN-001', dob: '1985-03-12', lastScan: '2 days ago' },
  { id: '2', name: 'Maria Garcia', mrn: 'MRN-002', dob: '1972-08-22', lastScan: '1 week ago' },
  { id: '3', name: 'Robert Kim', mrn: 'MRN-003', dob: '1990-11-05', lastScan: '3 days ago' },
  { id: '4', name: 'Sarah Chen', mrn: 'MRN-004', dob: '1968-01-30', lastScan: 'Today' },
  { id: '5', name: 'James Wilson', mrn: 'MRN-005', dob: '1955-07-18', lastScan: '5 days ago' },
  { id: '6', name: 'Emily Davis', mrn: 'MRN-006', dob: '1988-04-15', lastScan: '1 day ago' },
  { id: '7', name: 'Michael Brown', mrn: 'MRN-007', dob: '1975-11-20', lastScan: '4 days ago' },
  { id: '8', name: 'Lisa Anderson', mrn: 'MRN-008', dob: '1992-07-08', lastScan: '1 week ago' },
  { id: '9', name: 'David Martinez', mrn: 'MRN-009', dob: '1960-02-28', lastScan: '3 days ago' },
  { id: '10', name: 'Jennifer Taylor', mrn: 'MRN-010', dob: '1982-09-12', lastScan: 'Today' },
];

const PAGE_SIZE = 5;

export default function Patients() {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const patients = mockPatients;
  const filtered = query.trim()
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.mrn.toLowerCase().includes(query.toLowerCase())
      )
    : patients;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visible.length < filtered.length;
  const showLoadMore = hasMore && visible.length > 0;

  return (
    <div className="patients-page">
      <div className="patients-toolbar">
        <div className="patients-search-wrap">
          <Search size={18} className="patients-search-icon" />
          <input
            type="search"
            placeholder="Search by name or MRN..."
            className="input patients-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary">
          <Plus size={18} />
          Add patient
        </button>
      </div>

      <motion.div
        className="card patients-table-wrap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No patients found"
            description={query.trim() ? 'Try a different search term.' : 'Add patients to manage records and track scans.'}
            actionLabel="Add patient"
            onAction={() => {}}
          />
        ) : visible.length === 0 ? null : (
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>MRN</th>
              <th>DOB</th>
              <th>Last scan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <td>
                  <div className="patients-cell-patient">
                    <div className="patients-avatar">
                      <User size={16} />
                    </div>
                    <Link to={`/app/patients/${p.id}`} className="patients-name-link">{p.name}</Link>
                  </div>
                </td>
                <td><code>{p.mrn}</code></td>
                <td>{p.dob}</td>
                <td>{p.lastScan}</td>
                <td>
                  <button type="button" className="patients-menu-btn" aria-label="Actions">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        )}
        {showLoadMore && (
          <div className="patients-load-more">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            >
              Load more
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
