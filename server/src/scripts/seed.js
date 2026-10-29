// Usage: npm run seed            -> seed only if empty
//        npm run seed -- --reset -> wipe everything and reseed
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { seedDatabase } from '../services/seed.service.js';

if (!env.mongoUri) {
  console.log('MONGODB_URI is not set. The dev server seeds its in-memory database automatically on start.');
  process.exit(0);
}

await connectDB();
await seedDatabase({ reset: process.argv.includes('--reset') });
await disconnectDB();
console.log('[seed] done');
