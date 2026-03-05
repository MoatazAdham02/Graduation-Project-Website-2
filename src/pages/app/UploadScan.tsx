import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileImage, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import './UploadScan.css';

export default function UploadScan() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
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
      /\.(dcm|nii|nii\.gz|jpg|jpeg|png)$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...selected]);
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

  const handleStartUpload = () => {
    addToast('success', `Upload started for ${files.length} file(s). Analysis will begin shortly.`);
    setFiles([]);
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
          accept=".dcm,.nii,.nii.gz,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="upload-input-hidden"
        />
        <label htmlFor="upload-input" className="upload-zone-inner">
          <div className="upload-zone-icon">
            <Upload size={40} />
          </div>
          <h3>Drop DICOM or images here</h3>
          <p>or click to browse. Supports .dcm, .nii, .jpg, .png</p>
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
            <button type="button" className="btn btn-primary" onClick={handleStartUpload}>
              Start upload & analyze
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
