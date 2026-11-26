import { createApp } from './app.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startKeepAlive } from './lib/keep-alive.js';

const app = createApp();
let keepAliveHandle: ReturnType<typeof startKeepAlive> = null;

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Northline backend started');
  keepAliveHandle = startKeepAlive();
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received');
  keepAliveHandle?.stop();
  keepAliveHandle = null;

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected cleanly');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error disconnecting database during shutdown');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
