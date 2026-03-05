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
      .select('originalName size createdAt')
      .lean();
    res.json(scans.map((s) => ({ id: s._id, originalName: s.originalName, size: s.size, createdAt: s.createdAt })));
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
      createdAt: scan.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get scan' });
  }
});

router.post(
  '/upload',
  upload.array('file', 20),
  async (req, res) => {
    try {
      const files = req.files || [];
      if (files.length === 0) {
        return res.status(400).json({ error: 'No DICOM file uploaded. Use form field "file".' });
      }
      const created = [];
      for (const f of files) {
        const scan = await Scan.create({
          originalName: f.originalname,
          path: f.path,
          size: f.size,
          mimeType: f.mimetype || 'application/dicom'
        });
        created.push({
          id: scan._id,
          originalName: scan.originalName,
          size: scan.size,
          createdAt: scan.createdAt
        });
      }
      res.status(201).json({ ok: true, uploaded: created });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Upload failed' });
    }
  }
);

export default router;
