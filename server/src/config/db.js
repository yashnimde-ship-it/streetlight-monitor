import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDB() {
  let uri = env.mongoUri;

  if (!uri) {
    if (env.isProd && !env.inMemoryDb) {
      throw new Error('Set MONGODB_URI, or IN_MEMORY_DB=true for a demo without an external database');
    }
    // A throwaway MongoDB that lives as long as the server process. Small cache so it fits free hosting (512 MB).
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({ instance: { args: ['--wiredTigerCacheSizeGB', '0.25'] } });
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
