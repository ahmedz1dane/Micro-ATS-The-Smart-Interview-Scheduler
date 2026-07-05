import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { seedIfEmpty } from './seed.js';

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await seedIfEmpty();
  const app = createApp();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
