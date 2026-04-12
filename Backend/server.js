import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import itemsRoutes from './routes/items.routes.js';
import scanRoutes from './routes/scan.routes.js';
import authRoutes from './routes/auth.routes.js';
import User from './models/User.js';
import Scan from './models/Scan.js';

const PORT = process.env.PORT || 4000;
const app = express();

const corsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];
app.use(cors({ origin: [...new Set(corsOrigins)] }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const db = mongoose.connection.db;
  res.json({
    ok: true,
    database: stateNames[state] ?? 'unknown',
    databaseOk: state === 1,
    mongoDbName: db?.databaseName ?? null,
    mongoHost: mongoose.connection.host ?? null,
  });
});

/** Document counts (same DB as register/upload). Use port 4000, or frontend dev server with Vite proxy: /api → 4000 */
app.get('/api/health/stats', async (_req, res) => {
  try {
    const [userCount, scanCount] = await Promise.all([User.countDocuments(), Scan.countDocuments()]);
    res.json({
      ok: true,
      databaseName: mongoose.connection.db?.databaseName ?? null,
      userCount,
      scanCount,
      hint: 'In Atlas, open database name shown above (lowercase coronet), not the cluster display name.',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

app.use('/api/items', itemsRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  let status = err.status ?? err.statusCode ?? 500;
  if (err.code === 'LIMIT_FILE_SIZE') status = 400;
  res.status(status).json({ error: err.message || 'Server error' });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
