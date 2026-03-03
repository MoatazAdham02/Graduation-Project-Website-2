import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, FileText, ArrowLeft } from 'lucide-react';
import './PatientDetail.css';

const MOCK_PATIENTS: Record<string, { name: string; mrn: string; dob: string; lastScan: string }> = {
  '1': { name: 'John Doe', mrn: 'MRN-001', dob: '1985-03-12', lastScan: '2 days ago' },
  '2': { name: 'Maria Garcia', mrn: 'MRN-002', dob: '1972-08-22', lastScan: '1 week ago' },
  '3': { name: 'Robert Kim', mrn: 'MRN-003', dob: '1990-11-05', lastScan: '3 days ago' },
  '4': { name: 'Sarah Chen', mrn: 'MRN-004', dob: '1968-01-30', lastScan: 'Today' },
  '5': { name: 'James Wilson', mrn: 'MRN-005', dob: '1955-07-18', lastScan: '5 days ago' },
  '6': { name: 'Emily Davis', mrn: 'MRN-006', dob: '1988-04-15', lastScan: '1 day ago' },
  '7': { name: 'Michael Brown', mrn: 'MRN-007', dob: '1975-11-20', lastScan: '4 days ago' },
  '8': { name: 'Lisa Anderson', mrn: 'MRN-008', dob: '1992-07-08', lastScan: '1 week ago' },
  '9': { name: 'David Martinez', mrn: 'MRN-009', dob: '1960-02-28', lastScan: '3 days ago' },
  '10': { name: 'Jennifer Taylor', mrn: 'MRN-010', dob: '1982-09-12', lastScan: 'Today' },
};

const MOCK_STUDIES: Record<string, Array<{ id: string; type: string; date: string; reportId: string }>> = {
  '1': [
    { id: 's1', type: 'CT Chest', date: 'Mar 1, 2025', reportId: '1' },
    { id: 's2', type: 'X-Ray Chest', date: 'Feb 15, 2025', reportId: '1' },
  ],
  '2': [
    { id: 's3', type: 'MRI Brain', date: 'Feb 28, 2025', reportId: '2' },
  ],
  '3': [
    { id: 's4', type: 'X-Ray Spine', date: 'Feb 27, 2025', reportId: '3' },
  ],
};

function getStudies(patientId: string) {
  return MOCK_STUDIES[patientId] ?? [];
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patient = id ? MOCK_PATIENTS[id] : null;
  const studies = id ? getStudies(id) : [];

  if (!patient) {
    return (
      <div className="patient-detail-page">
        <div className="card patient-detail-card">
          <p>Patient not found.</p>
          <Link to="/app/patients" className="btn btn-primary">Back to patients</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-detail-page">
      <motion.div
        className="patient-detail-card card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/app/patients" className="patient-detail-back">
          <ArrowLeft size={18} />
          Back to patients
        </Link>

        <header className="patient-detail-header">
          <div className="patient-detail-avatar">
            <User size={32} />
          </div>
          <div>
            <h1 className="patient-detail-name">{patient.name}</h1>
            <div className="patient-detail-meta">
              <span><code>{patient.mrn}</code></span>
              <span><Calendar size={14} /> DOB: {patient.dob}</span>
              <span>Last scan: {patient.lastScan}</span>
            </div>
          </div>
        </header>

        <section className="patient-detail-section">
          <h2>Studies</h2>
          {studies.length === 0 ? (
            <p className="patient-detail-empty">No studies yet.</p>
          ) : (
            <ul className="patient-detail-studies">
              {studies.map((s) => (
                <li key={s.id} className="patient-detail-study card">
                  <FileText size={20} className="patient-detail-study-icon" />
                  <div>
                    <strong>{s.type}</strong>
                    <span className="patient-detail-study-date">{s.date}</span>
                  </div>
                  <Link to={`/app/reports/${s.reportId}`} className="btn btn-ghost btn-sm">View report</Link>
                  <Link to="/app/compare" className="btn btn-secondary btn-sm">Compare</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </motion.div>
    </div>
  );
}
