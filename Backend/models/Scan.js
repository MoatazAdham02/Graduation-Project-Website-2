import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    originalName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true
    },
    path: {
      type: String,
      required: [true, 'File path is required']
    },
    size: {
      type: Number,
      required: [true, 'File size is required']
    },
    mimeType: {
      type: String,
      default: 'application/dicom'
    },
    doctorName: {
      type: String,
      trim: true,
      default: ''
    },
    patientName: {
      type: String,
      trim: true,
      default: ''
    },
    studyDate: {
      type: String,
      default: ''
    },
    modality: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Index for efficient querying
scanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Scan', scanSchema);
