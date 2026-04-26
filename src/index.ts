import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { getRedisClient } from './lib/redis.js';

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    try {
      await getRedisClient().ping();
      console.log('Redis connected');
    } catch {
      console.warn('Redis not available - live caching disabled');
    }

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    function shutdown(signal: string) {
      console.log(`\n${signal} received - shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server closed');
        process.exit(0);
      });
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
