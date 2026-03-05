import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileImage, X, Loader2 } from 'lucide-react';
import dicomParser from 'dicom-parser';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import './UploadScan.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getDicomTag(
  dataSet: dicomParser.DataSet,
  tag: string
): string {
  try {
    const elements = (dataSet as unknown as { elements: Record<string, { dataOffset: number; length: number }> }).elements;
    const raw = elements[tag];
    if (!raw) return '';
    const arr = new Uint8Array(
      dataSet.byteArray.buffer,
      dataSet.byteArray.byteOffset + raw.dataOffset,
      raw.length
    );
    return new TextDecoder().decode(arr).trim();
  } catch {
    return '';
  }
}

function extractDicomMetadata(arrayBuffer: ArrayBuffer): { patientName: string; studyDate: string; modality: string } {
  try {
    const byteArray = new Uint8Array(arrayBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    return {
      patientName: getDicomTag(dataSet, 'x00100010') || '',
      studyDate: getDicomTag(dataSet, 'x00080020') || '',
      modality: getDicomTag(dataSet, 'x00080060') || '',
    };
  } catch {
    return { patientName: '', studyDate: '', modality: '' };
  }
}

export default function UploadScan() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();
  const { confirm } = useConfirm();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(dcm|dicom)$/i.test(f.name)
    );
    if (dropped.length < e.dataTransfer.files.length) {
      addToast('info', 'Only DICOM files (.dcm, .dicom) are accepted. Other files were skipped.');
    }
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    const dicomOnly = selected.filter((f) => /\.(dcm|dicom)$/i.test(f.name));
    if (dicomOnly.length < selected.length) {
      addToast('info', 'Only DICOM files (.dcm, .dicom) are accepted.');
    }
    setFiles((prev) => [...prev, ...dicomOnly]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    confirm({
      title: 'Clear all files',
      message: 'Remove all selected files from the upload list?',
      confirmLabel: 'Clear all',
      variant: 'danger',
      onConfirm: () => { setFiles([]); addToast('info', 'Upload list cleared'); },
    });
  };

  const handleStartUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    let skippedCount = 0;
    try {
      for (const file of files) {
        let patientName = '';
        let studyDate = '';
        let modality = '';
        try {
          const buf = await file.arrayBuffer();
          const meta = extractDicomMetadata(buf);
          patientName = meta.patientName;
          studyDate = meta.studyDate;
          modality = meta.modality;
        } catch {
          // use empty metadata if parse fails
        }
        const form = new FormData();
        form.append('file', file);
        form.append('patientName', patientName);
        form.append('studyDate', studyDate);
        form.append('modality', modality);
        const res = await fetch(`${API_URL}/api/scan/upload`, {
          method: 'POST',
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          addToast('error', data.error || `Upload failed for ${file.name}`);
          continue;
        }
        if (data.skipped) {
          skippedCount += 1;
          addToast('info', data.reason || 'Duplicate scan skipped.');
          continue;
        }
        successCount += data.uploaded?.length ?? 1;
      }
      if (successCount > 0) {
        addToast('success', `${successCount} DICOM file(s) uploaded. Patient info is available on the Patients page.`);
        setFiles([]);
      }
      if (skippedCount > 0 && successCount === 0) {
        addToast('info', `${skippedCount} file(s) skipped (already exist).`);
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-scan-page">
      <motion.div
        className={`upload-zone card ${dragActive ? 'upload-zone-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <input
          type="file"
          id="upload-input"
          multiple
          accept=".dcm,.dicom,application/dicom"
          onChange={handleFileInput}
          className="upload-input-hidden"
        />
        <label htmlFor="upload-input" className="upload-zone-inner">
          <div className="upload-zone-icon">
            <Upload size={40} />
          </div>
          <h3>Drop DICOM files here</h3>
          <p>or click to browse. Supports any .dcm or .dicom file</p>
        </label>
      </motion.div>

      {files.length > 0 && (
        <motion.div
          className="upload-list card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Selected files ({files.length})</h3>
          <ul>
            {files.map((f, i) => (
              <motion.li
                key={`${f.name}-${i}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="upload-list-item"
              >
                <FileImage size={20} />
                <span className="upload-list-name">{f.name}</span>
                <span className="upload-list-size">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  className="upload-list-remove"
                  onClick={() => removeFile(i)}
                  aria-label="Remove"
                >
                  <X size={16} />
                </button>
              </motion.li>
            ))}
          </ul>
          <div className="upload-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClearAll}>
              Clear all
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Uploading…
                </>
              ) : (
                'Start upload'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
