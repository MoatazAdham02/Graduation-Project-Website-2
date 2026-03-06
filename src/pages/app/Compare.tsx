import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Upload, Layers, Loader2 } from 'lucide-react';
import './Compare.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ScanInfo = { id: string; originalName: string } | null;

export default function Compare() {
  const [scanA, setScanA] = useState<ScanInfo>(null);
  const [scanB, setScanB] = useState<ScanInfo>(null);
  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    file: File,
    setScan: (s: ScanInfo) => void,
    setUploading: (u: boolean) => void
  ) => {
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('patientName', '');
      form.append('studyDate', '');
      form.append('modality', '');
      const res = await fetch(`${API_URL}/api/scan/upload`, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      const uploaded = data.uploaded?.[0];
      if (uploaded) setScan({ id: uploaded.id, originalName: uploaded.originalName });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && /\.(dcm|dicom)$/i.test(file.name)) {
      handleUpload(file, setScanA, setUploadingA);
    } else if (file) {
      setUploadError('Only DICOM files (.dcm, .dicom) are allowed.');
    }
    e.target.value = '';
  };

  const handleFileB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && /\.(dcm|dicom)$/i.test(file.name)) {
      handleUpload(file, setScanB, setUploadingB);
    } else if (file) {
      setUploadError('Only DICOM files (.dcm, .dicom) are allowed.');
    }
    e.target.value = '';
  };

  return (
    <div className="compare-page">
      <motion.div
        className="compare-layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="compare-panel card">
          <div className="compare-panel-header">
            <span>Scan A</span>
            <input
              ref={inputARef}
              type="file"
              accept=".dcm,.dicom,application/dicom"
              className="compare-input-hidden"
              onChange={handleFileA}
              disabled={uploadingA}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputARef.current?.click()}
              disabled={uploadingA}
            >
              {uploadingA ? <Loader2 size={16} className="compare-spin" /> : <Upload size={16} />}
              Upload DICOM file
            </button>
          </div>
          <div className="compare-panel-placeholder">
            {scanA ? (
              <p className="compare-scan-name">{scanA.originalName}</p>
            ) : (
              <>
                <Layers size={40} />
                <p>No scan selected</p>
              </>
            )}
          </div>
        </div>

        <div className="compare-divider">
          <GitCompare size={24} />
          <span>Compare</span>
        </div>

        <div className="compare-panel card">
          <div className="compare-panel-header">
            <span>Scan B</span>
            <input
              ref={inputBRef}
              type="file"
              accept=".dcm,.dicom,application/dicom"
              className="compare-input-hidden"
              onChange={handleFileB}
              disabled={uploadingB}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputBRef.current?.click()}
              disabled={uploadingB}
            >
              {uploadingB ? <Loader2 size={16} className="compare-spin" /> : <Upload size={16} />}
              Upload DICOM file
            </button>
          </div>
          <div className="compare-panel-placeholder">
            {scanB ? (
              <p className="compare-scan-name">{scanB.originalName}</p>
            ) : (
              <>
                <Layers size={40} />
                <p>No scan selected</p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {uploadError && (
        <p className="compare-error">{uploadError}</p>
      )}

      <motion.div
        className="compare-actions card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button type="button" className="btn btn-primary">
          Run comparison
        </button>
      </motion.div>
    </div>
  );
}
