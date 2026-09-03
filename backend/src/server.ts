import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    console.log(`Smart Logistics API listening on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received; shutting down`);
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Unable to start API', error);
  process.exit(1);
});
