import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.routes.js';
import lightRoutes from './routes/lights.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import reportRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import statsRoutes from './routes/stats.routes.js';

const CLIENT_DIST = fileURLToPath(new URL('../../client/dist', import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render/Vercel sit behind a proxy; needed for rate limiting
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Map tiles come from OpenStreetMap; React and Leaflet set inline style attributes.
          'img-src': ["'self'", 'data:', 'https://tile.openstreetmap.org'],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );
  app.use(compression()); // the map endpoint returns tens of thousands of points
  app.use(cors({ origin: env.clientOrigins }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/lights', requireAuth, lightRoutes);
  app.use('/api/maintenance', requireAuth, maintenanceRoutes);
  app.use('/api/stats', requireAuth, statsRoutes);
  app.use('/api/reports', requireAuth, reportRoutes);
  app.use('/api/settings', requireAuth, settingsRoutes);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

  // Single-service deploy: serve the built web app (client/dist) when it exists.
  if (existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
