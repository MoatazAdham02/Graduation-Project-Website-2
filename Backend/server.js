import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import scanRoutes from './routes/scan.js';
import itemsRoutes from './routes/items.js';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration
const corsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
];

app.use(cors({ origin: [...new Set(corsOrigins)] }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoints
app.get('/api/health', (req, res) => {
  const connectionState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    success: true,
    status: 'API is running',
    database: states[connectionState] || 'unknown',
    databaseOk: connectionState === 1,
    mongoDbName: mongoose.connection.db?.databaseName || null,
    mongoHost: mongoose.connection.host || null,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/stats', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Scan = mongoose.model('Scan');

    const [userCount, scanCount] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments()
    ]);

    res.json({
      success: true,
      database: mongoose.connection.db?.databaseName || null,
      userCount,
      scanCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to get statistics'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/items', itemsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File size exceeds maximum limit (500 MB)';
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    status = 400;
    message = 'Too many files uploaded';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Unexpected file field';
  }

  res.status(status).json({
    success: false,
    error: message
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🏥 COROnet Backend Server Started              ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🌐 API URL: http://localhost:${PORT}                      ║
║  📚 API Docs: http://localhost:${PORT}/api-docs (coming)   ║
║  🔗 CORS Origins:                                         ║
      `);
      corsOrigins.forEach(origin => {
        console.log(`     - ${origin}`);
      });
      console.log(`║                                                           ║
║  ✅ Ready to accept requests                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
