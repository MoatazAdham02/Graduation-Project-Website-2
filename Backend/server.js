import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import itemsRoutes from './routes/items.routes.js';
import scanRoutes from './routes/scan.routes.js';
import authRoutes from './routes/auth.routes.js';

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ ok: true, database: stateNames[state] ?? 'unknown', databaseOk: state === 1 });
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
