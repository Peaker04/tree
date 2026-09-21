import { buildApp } from './app';
import { loadEnv, getSecurityConfig } from './config/env';
import { createDatabaseConnection } from './infrastructure/persistence/db';

export async function startServer(): Promise<void> {
  const env = loadEnv();
  const securityConfig = getSecurityConfig(env);

  if (!env.DATABASE_RUNTIME_URL) {
    throw new Error('DATABASE_RUNTIME_URL is required to start the API server');
  }

  const dbConn = createDatabaseConnection(env.DATABASE_RUNTIME_URL);

  const app = buildApp({
    logger: env.NODE_ENV !== 'test',
    pool: dbConn.pool,
    securityConfig,
  });

  const closeGracefully = async (signal: string) => {
    app.log.info(`Received ${signal}, closing server gracefully...`);
    await app.close();
    await dbConn.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void closeGracefully('SIGINT'));
  process.on('SIGTERM', () => void closeGracefully('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`NOVYX GreenOps API server listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Self-execution if run directly
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
