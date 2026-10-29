import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { seedDatabase } from './services/seed.service.js';

await connectDB();
await seedDatabase(); // no-op once data exists

const server = createApp().listen(env.port, () => {
  console.log(`[api] listening on http://localhost:${env.port}/api`);
});

const shutdown = async () => {
  server.close();
  await disconnectDB();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
