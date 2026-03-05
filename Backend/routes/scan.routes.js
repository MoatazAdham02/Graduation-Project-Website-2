import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Scan from '../models/Scan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../uploads/dicom');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = Date.now() + '-' + (file.originalname || 'scan').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /\.(dcm|dicom)$/i.test(file.originalname || '') ||
      file.mimetype === 'application/dicom';
    if (ok) cb(null, true);
    else cb(new Error('Only DICOM files (.dcm, .dicom) are allowed'), false);
  }
});

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const scans = await Scan.find()
      .sort({ createdAt: -1 })
      .select('originalName size createdAt patientName studyDate modality')
      .lean();
    res.json(scans.map((s) => ({
      id: s._id,
      originalName: s.originalName,
      size: s.size,
      createdAt: s.createdAt,
      patientName: s.patientName || '',
      studyDate: s.studyDate || '',
      modality: s.modality || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list scans' });
  }
});

router.get('/:id/file', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    const absolutePath = path.resolve(scan.path);
    if (!absolutePath.startsWith(path.resolve(UPLOAD_DIR))) {
      return res.status(403).json({ error: 'Invalid path' });
    }
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    res.setHeader('Content-Type', scan.mimeType || 'application/dicom');
    res.sendFile(absolutePath);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to serve file' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id).lean();
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({
      id: scan._id,
      originalName: scan.originalName,
      size: scan.size,
      mimeType: scan.mimeType,
      createdAt: scan.createdAt,
      patientName: scan.patientName || '',
      studyDate: scan.studyDate || '',
      modality: scan.modality || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get scan' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    const absolutePath = path.resolve(scan.path);
    if (absolutePath.startsWith(path.resolve(UPLOAD_DIR)) && fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (e) {
        // continue to delete DB record even if file delete fails
      }
    }
    await Scan.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete scan' });
  }
});

router.post(
  '/upload',
  upload.single('file'),
  async (req, res) => {
    try {
      const f = req.file;
      if (!f) {
        return res.status(400).json({ error: 'No DICOM file uploaded. Use form field "file".' });
      }
      const patientName = (req.body && req.body.patientName) ? String(req.body.patientName).trim() : '';
      const studyDate = (req.body && req.body.studyDate) ? String(req.body.studyDate).trim() : '';
      const modality = (req.body && req.body.modality) ? String(req.body.modality).trim() : '';

      const existing = await Scan.findOne({
        originalName: f.originalname,
        studyDate: studyDate || ''
      }).lean();
      if (existing && (existing.patientName || '').toLowerCase() === (patientName || '').toLowerCase()) {
        return res.status(201).json({
          ok: true,
          uploaded: [],
          skipped: true,
          reason: 'A scan with the same patient, study date, and file name already exists.'
        });
      }

      const scan = await Scan.create({
        originalName: f.originalname,
        path: f.path,
        size: f.size,
        mimeType: f.mimetype || 'application/dicom',
        patientName,
        studyDate,
        modality
      });
      res.status(201).json({
        ok: true,
        uploaded: [{
          id: scan._id,
          originalName: scan.originalName,
          size: scan.size,
          createdAt: scan.createdAt,
          patientName: scan.patientName,
          studyDate: scan.studyDate,
          modality: scan.modality
        }]
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  }
);

export default router;
