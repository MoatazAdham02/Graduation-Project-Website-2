import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, default: 'application/dicom' }
  },
  { timestamps: true }
);

export default mongoose.model('Scan', scanSchema);
