import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, User, Loader2, FileImage, Trash2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';
import './Patients.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ScanPatient = {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
  patientName: string;
  studyDate: string;
  modality: string;
};

/** One row per patient: group scans by patient name (case-insensitive). Unnamed scans stay as separate rows by id. */
function groupScansByPatient(scans: ScanPatient[]): { key: string; displayName: string; scans: ScanPatient[] }[] {
  const map = new Map<string, ScanPatient[]>();
  const nameByKey = new Map<string, string>();
  for (const s of scans) {
    const normalized = (s.patientName || '').trim().toLowerCase();
    const key = normalized || `_scan_${s.id}`;
    if (!map.has(key)) {
      map.set(key, []);
      nameByKey.set(key, (s.patientName || '').trim() || '—');
    }
    map.get(key)!.push(s);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date((b.createdAt as string) || 0).getTime() - new Date((a.createdAt as string) || 0).getTime());
  }
  return Array.from(map.entries()).map(([key, scans]) => ({
    key,
    displayName: nameByKey.get(key) || '—',
    scans,
  }));
}

const PAGE_SIZE = 10;

function formatDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function formatStudyDate(s: string | undefined): string {
  if (!s || !s.trim()) return '—';
  if (s.length === 8) {
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    return `${y}-${m}-${d}`;
  }
  return s;
}

export default function Patients() {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [patients, setPatients] = useState<ScanPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/scan`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(data.error || 'Failed to load patients');
          return;
        }
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) setPatients(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered =
    query.trim()
      ? patients.filter(
          (p) =>
            (p.patientName || '').toLowerCase().includes(query.toLowerCase()) ||
            (p.modality || '').toLowerCase().includes(query.toLowerCase()) ||
            (p.originalName || '').toLowerCase().includes(query.toLowerCase())
        )
      : patients;

  const grouped = groupScansByPatient(filtered);
  const visible = grouped.slice(0, visibleCount);
  const hasMore = visible.length < grouped.length;
  const showLoadMore = hasMore && visible.length > 0;

  const handleViewScan = (scanId: string) => {
    navigate('/app/analysis', { state: { scanId } });
  };

  const handleDelete = (group: { key: string; displayName: string; scans: ScanPatient[] }) => {
    const count = group.scans.length;
    const name = group.displayName === '—' ? 'this patient' : group.displayName;
    confirm({
      title: 'Delete patient record(s)',
      message: count > 1
        ? `Delete all ${count} scans for ${name}? This cannot be undone.`
        : `Delete the scan for ${name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          for (const scan of group.scans) {
            const res = await fetch(`${API_URL}/api/scan/${scan.id}`, { method: 'DELETE' });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              addToast('error', data.error || 'Failed to delete');
              return;
            }
          }
          const ids = new Set(group.scans.map((s) => s.id));
          setPatients((prev) => prev.filter((x) => !ids.has(x.id)));
          addToast('success', count > 1 ? `${count} scans deleted.` : 'Scan deleted.');
        } catch (e) {
          addToast('error', e instanceof Error ? e.message : 'Failed to delete');
        }
      },
    });
  };

  return (
    <div className="patients-page">
      <div className="patients-toolbar">
        <div className="patients-search-wrap">
          <Search size={18} className="patients-search-icon" />
          <input
            type="search"
            placeholder="Search by patient name, modality, or scan name..."
            className="input patients-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <motion.div
        className="card patients-table-wrap"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="patients-loading">
            <Loader2 size={40} className="spin" />
            <p>Loading patients…</p>
          </div>
        ) : error ? (
          <div className="patients-error">
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No patients yet"
            description={query.trim() ? 'No patients match your search.' : 'Upload DICOM files from the Upload page. Patient info from each file will appear here.'}
            actionLabel="Go to Upload"
            onAction={() => navigate('/app/upload')}
          />
        ) : visible.length === 0 ? null : (
          <>
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Modality</th>
                  <th>Study date</th>
                  <th>Scans</th>
                  <th>Last uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((group, i) => {
                  const first = group.scans[0];
                  const modalities = [...new Set(group.scans.map((s) => (s.modality || '').trim()).filter(Boolean))];
                  const studyDates = [...new Set(group.scans.map((s) => formatStudyDate(s.studyDate)).filter((d) => d !== '—'))];
                  return (
                    <motion.tr
                      key={group.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className="patients-cell-patient">
                          <div className="patients-avatar">
                            <User size={16} />
                          </div>
                          <span className="patients-name-link">
                            {group.displayName}
                          </span>
                        </div>
                      </td>
                      <td>{modalities.length ? modalities.join(', ') : '—'}</td>
                      <td>{studyDates.length ? (studyDates.length > 1 ? studyDates.slice(0, 2).join(', ') + (studyDates.length > 2 ? '…' : '') : studyDates[0]) : '—'}</td>
                      <td>{group.scans.length}</td>
                      <td>{formatDate(first.createdAt)}</td>
                      <td>
                        <div className="patients-row-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewScan(first.id)}
                          >
                            <FileImage size={14} />
                            View scan
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm patients-delete-btn"
                            onClick={() => handleDelete(group)}
                            aria-label="Delete patient"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
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
          </>
        )}
      </motion.div>
    </div>
  );
}
