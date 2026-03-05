import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Calendar, User, ArrowLeft, Printer, Copy } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import './ReportDetail.css';

const MOCK_REPORTS: Record<string, { title: string; date: string; type: string; status: string; findings: string; impression: string; aiSummary: string }> = {
  '1': { title: 'CT Chest — John Doe', date: 'Mar 1, 2025', type: 'Radiology', status: 'Final', findings: 'No focal consolidation. No pleural effusion. Heart size normal. No mediastinal widening.', impression: 'Normal chest CT.', aiSummary: 'AI-assisted review: No acute findings. Confidence 98%.' },
  '2': { title: 'MRI Brain — Maria G.', date: 'Feb 28, 2025', type: 'Radiology', status: 'Draft', findings: 'No mass effect. No midline shift. Parenchymal signal within normal limits.', impression: 'Normal brain MRI. Recommend clinical correlation.', aiSummary: 'AI-assisted review: Normal study. Minor motion artifact noted.' },
  '3': { title: 'X-Ray Spine — Robert K.', date: 'Feb 27, 2025', type: 'Radiology', status: 'Final', findings: 'Alignment maintained. No fracture. Disc spaces preserved.', impression: 'No acute osseous abnormality.', aiSummary: 'AI-assisted review: No acute findings.' },
  '4': { title: 'CT Abdomen — Sarah C.', date: 'Feb 26, 2025', type: 'Radiology', status: 'Final', findings: 'Liver, spleen, kidneys unremarkable. No free fluid.', impression: 'Normal CT abdomen.', aiSummary: 'AI-assisted review: Normal. No focal lesions.' },
  '5': { title: 'MRI Knee — James W.', date: 'Feb 25, 2025', type: 'Radiology', status: 'Draft', findings: 'ACL intact. Menisci without tear. No joint effusion.', impression: 'Normal MRI knee.', aiSummary: 'AI-assisted review: Ligaments and menisci normal.' },
  '6': { title: 'X-Ray Hand — Emily D.', date: 'Feb 24, 2025', type: 'Radiology', status: 'Final', findings: 'No fracture or dislocation. Soft tissues unremarkable.', impression: 'Normal hand X-ray.', aiSummary: 'AI-assisted review: No acute findings.' },
};

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const report = id ? MOCK_REPORTS[id] : null;
  const { addToast } = useToast();

  const handlePrint = () => window.print();

  const handleExportPdf = () => {
    addToast('success', 'Report exported as PDF');
  };

  const handleCopySummary = () => {
    if (!report) return;
    const text = `${report.findings}\n\nImpression: ${report.impression}\n\n${report.aiSummary}`;
    navigator.clipboard.writeText(text).then(() => addToast('success', 'Summary copied to clipboard'));
  };

  if (!report) {
    return (
      <div className="report-detail-page">
        <div className="card report-detail-card">
          <p>Report not found.</p>
          <Link to="/app/reports" className="btn btn-primary">Back to reports</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="report-detail-page">
      <motion.div
        className="report-detail-card card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="report-detail-header">
          <Link to="/app/reports" className="report-detail-back">
            <ArrowLeft size={18} />
            Back to reports
          </Link>
          <div className="report-detail-actions">
            <button type="button" className="btn btn-ghost" onClick={handlePrint}>
              <Printer size={18} />
              Print
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleCopySummary}>
              <Copy size={18} />
              Copy summary
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportPdf}>
              <Download size={18} />
              Export PDF
            </button>
          </div>
        </div>

        <header className="report-detail-meta">
          <h1 className="report-detail-title">{report.title}</h1>
          <div className="report-detail-meta-row">
            <span><Calendar size={16} /> {report.date}</span>
            <span><User size={16} /> {report.type}</span>
            <span className={`report-detail-status report-detail-status--${report.status.toLowerCase()}`}>{report.status}</span>
          </div>
        </header>

        <section className="report-detail-section">
          <h2>Findings</h2>
          <p>{report.findings}</p>
        </section>
        <section className="report-detail-section">
          <h2>Impression</h2>
          <p>{report.impression}</p>
        </section>
        <section className="report-detail-section report-detail-ai">
          <h2>AI summary</h2>
          <p>{report.aiSummary}</p>
        </section>
      </motion.div>
    </div>
  );
}
