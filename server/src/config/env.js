import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  // Empty means "use an in-memory MongoDB": always in development, in production only with IN_MEMORY_DB=true.
  mongoUri: process.env.MONGODB_URI || '',
  // Demo deployments without an external database (data is reseeded on every start).
  inMemoryDb: process.env.IN_MEMORY_DB === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@streetlight.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
