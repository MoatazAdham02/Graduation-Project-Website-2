import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import itemsRoutes from './routes/items.routes.js';
import authRoutes from './routes/auth.routes.js';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    ok: true,
    message: 'API running',
    database: stateNames[dbState] ?? 'unknown',
    databaseOk: dbState === 1
  });
});

app.use('/api/items', itemsRoutes);
app.use('/api/auth', authRoutes);

await connectDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
