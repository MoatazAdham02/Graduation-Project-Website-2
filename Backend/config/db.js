import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'coronet';

    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not defined in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 15000,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${dbName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

export function disconnectDB() {
  mongoose.disconnect();
  console.log('🔌 MongoDB Disconnected');
}
