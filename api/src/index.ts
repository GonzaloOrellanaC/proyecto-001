import 'dotenv/config';
import { createApp } from './app';
import { connectMongo } from './config/db.js';
import { seedDefaultAdminFromEnv } from './bootstrap/seed.js';

async function main() {
  const app = createApp();
  // Ensure DB is connected before seeding and starting the server
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pv';
  await connectMongo(uri);
  await seedDefaultAdminFromEnv();

  const PORT = Number(process.env.PORT || 4000);
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
