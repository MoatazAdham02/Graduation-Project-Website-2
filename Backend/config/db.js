import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/** Kept alive so the in-memory server does not shut down during the process lifetime */
let memoryServer = null;

const connectOpts = {
  serverSelectionTimeoutMS: 15000,
};

/** All app data (users, scans, items) is stored in this database in Atlas (always lowercase — COROnet ≠ coronet in MongoDB). */
function mongoDbName() {
  return ((process.env.MONGODB_DB_NAME || 'coronet').trim() || 'coronet').toLowerCase();
}

function memoryFallbackDisabled() {
  const v = (process.env.DISABLE_MEMORY_MONGO_FALLBACK || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export async function connectDB() {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (memoryFallbackDisabled() && !uri) {
    console.error('Missing MONGODB_URI in Backend/.env');
    process.exit(1);
  }

  async function connectWithMessage(connectionUri, label, extraOpts = {}) {
    await mongoose.connect(connectionUri, { ...connectOpts, ...extraOpts });
    console.log(`MongoDB connected (${label})`);
    if (extraOpts.dbName) {
      console.log(`[MongoDB] Using database: ${extraOpts.dbName}`);
    }
  }

  if (uri) {
    try {
      await connectWithMessage(uri, 'configured URI', { dbName: mongoDbName() });
      return;
    } catch (err) {
      console.warn('[MongoDB] Configured URI failed:', err.message || err);
      await mongoose.disconnect().catch(() => {});
    }
  }

  if (memoryFallbackDisabled()) {
    console.error('Set MONGODB_URI correctly, or remove DISABLE_MEMORY_MONGO_FALLBACK to use dev fallback.');
    process.exit(1);
  }

  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI is empty — using in-memory database for this session.');
  } else {
    console.warn('');
    console.warn('>>> Using in-memory MongoDB: data is NOT saved to Atlas and is lost when you stop the server.');
    console.warn('>>> To use Atlas: fix Network Access (IP list), user/password in MONGODB_URI, and cluster host from Connect → Drivers.');
    console.warn('>>> To disable this fallback: set DISABLE_MEMORY_MONGO_FALLBACK=1');
    console.warn('');
  }

  try {
    memoryServer = await MongoMemoryServer.create();
    await connectWithMessage(memoryServer.getUri(), 'in-memory (dev fallback)', {
      dbName: mongoDbName(),
    });
  } catch (err) {
    console.error('MongoDB in-memory fallback failed:', err.message || err);
    process.exit(1);
  }
}
