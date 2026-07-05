import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', now: new Date().toISOString() }));
  app.use('/api', routes);

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
