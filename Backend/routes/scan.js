import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Scan from '../models/Scan.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../uploads/dicom');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.dcm', '.dicom'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext) || file.mimetype === 'application/dicom') {
      cb(null, true);
    } else {
      cb(new Error('Only DICOM files (.dcm, .dicom) are allowed'));
    }
  }
});

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all scans for authenticated user
router.get('/', async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: scans.length,
      scans: scans.map(scan => ({
        id: scan._id,
        originalName: scan.originalName,
        size: scan.size,
        createdAt: scan.createdAt,
        patientName: scan.patientName || '',
        studyDate: scan.studyDate || '',
        modality: scan.modality || '',
        doctorName: scan.doctorName || ''
      }))
    });
  } catch (err) {
    console.error('❌ Get scans error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to list scans'
    });
  }
});

// Get specific scan metadata
router.get('/:id', async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).lean();

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    res.json({
      success: true,
      scan: {
        id: scan._id,
        originalName: scan.originalName,
        size: scan.size,
        mimeType: scan.mimeType,
        createdAt: scan.createdAt,
        patientName: scan.patientName || '',
        studyDate: scan.studyDate || '',
        modality: scan.modality || '',
        doctorName: scan.doctorName || ''
      }
    });
  } catch (err) {
    console.error('❌ Get scan error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to get scan'
    });
  }
});

// Download DICOM file
router.get('/:id/file', async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    const filePath = path.resolve(scan.path);
    const uploadDirResolved = path.resolve(UPLOAD_DIR);

    // Security: ensure file is within upload directory
    if (!filePath.startsWith(uploadDirResolved)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    res.setHeader('Content-Type', scan.mimeType || 'application/dicom');
    res.setHeader('Content-Disposition', `attachment; filename="${scan.originalName}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error('❌ Download file error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to download file'
    });
  }
});

// Upload DICOM file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No DICOM file uploaded. Use form field "file"'
      });
    }

    const patientName = req.body?.patientName ? String(req.body.patientName).trim() : '';
    const studyDate = req.body?.studyDate ? String(req.body.studyDate).trim() : '';
    const modality = req.body?.modality ? String(req.body.modality).trim() : '';

    // Check for duplicates
    const existingScan = await Scan.findOne({
      userId: req.user._id,
      originalName: req.file.originalname,
      studyDate: studyDate || '',
      patientName: { $regex: `^${patientName}$`, $options: 'i' }
    }).lean();

    if (existingScan) {
      // Delete uploaded file since it's a duplicate
      fs.unlinkSync(req.file.path);
      
      return res.status(201).json({
        success: true,
        message: 'Scan already exists',
        skipped: true,
        reason: 'A scan with the same patient, study date, and file name already exists'
      });
    }

    // Create scan record
    const scan = await Scan.create({
      userId: req.user._id,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype || 'application/dicom',
      doctorName: req.user.name,
      patientName,
      studyDate,
      modality
    });

    console.log(`✅ DICOM file uploaded: ${scan.originalName}`);

    res.status(201).json({
      success: true,
      message: 'DICOM file uploaded successfully',
      scan: {
        id: scan._id,
        originalName: scan.originalName,
        size: scan.size,
        createdAt: scan.createdAt,
        patientName: scan.patientName,
        studyDate: scan.studyDate,
        modality: scan.modality
      }
    });
  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('❌ Upload error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to upload file'
    });
  }
});

// Delete scan
router.delete('/:id', async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    const filePath = path.resolve(scan.path);
    const uploadDirResolved = path.resolve(UPLOAD_DIR);

    // Security check
    if (filePath.startsWith(uploadDirResolved) && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('⚠️  Could not delete file:', err.message);
      }
    }

    await Scan.deleteOne({ _id: req.params.id, userId: req.user._id });

    console.log(`✅ Scan deleted: ${scan.originalName}`);

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete scan'
    });
  }
});

export default router;
