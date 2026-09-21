import { buildApp } from './app';
import { loadEnv } from './config/env';
import { createDatabaseConnection } from './infrastructure/persistence/db';

export async function startServer(): Promise<void> {
  const env = loadEnv();

  let dbConn: ReturnType<typeof createDatabaseConnection> | undefined;
  if (env.DATABASE_RUNTIME_URL) {
    dbConn = createDatabaseConnection(env.DATABASE_RUNTIME_URL);
  }

  const app = buildApp({
    logger: env.NODE_ENV !== 'test',
    pool: dbConn?.pool,
  });

  const closeGracefully = async (signal: string) => {
    app.log.info(`Received ${signal}, closing server gracefully...`);
    await app.close();
    if (dbConn) {
      await dbConn.close();
    }
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
