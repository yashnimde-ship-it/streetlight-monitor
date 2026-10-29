import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDB() {
  let uri = env.mongoUri;

  if (!uri) {
    if (env.isProd) throw new Error('MONGODB_URI must be set in production');
    // Dev fallback: a throwaway MongoDB that lives as long as the server process.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('streetlight-monitor');
    console.log('[db] MONGODB_URI not set: using in-memory MongoDB (data resets on restart)');
  }

  await mongoose.connect(uri);
  console.log('[db] connected');
  return { inMemory: Boolean(memoryServer) };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
