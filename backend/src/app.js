import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', now: new Date().toISOString() }));
  app.use('/api', routes);

  // When a production build of the frontend exists (e.g. on the deployed host),
  // serve it from the same server so the whole app is reachable at one URL. In
  // local dev there's no build, so this is skipped and the Vite proxy is used.
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    // SPA fallback: any non-API GET returns index.html so client-side routes work.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

  app.use((err, _req, res, _next) => {
    if (err.name === 'CastError' || err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid request data.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
