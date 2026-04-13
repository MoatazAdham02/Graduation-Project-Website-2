import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorName: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, default: 'application/dicom' },
    patientName: { type: String, default: '' },
    studyDate: { type: String, default: '' },
    modality: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Scan', scanSchema);
