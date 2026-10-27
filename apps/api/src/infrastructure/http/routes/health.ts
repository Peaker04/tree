import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type pg from 'pg';
import { checkDbConnection } from '../../persistence/db';

export interface HealthRouteOptions {
  pool?: pg.Pool | undefined;
}

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (
  fastify: FastifyInstance,
  options: HealthRouteOptions,
) => {
  // Operational Liveness check (GET /health)
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  // iOS Expo Go Smart Web Landing (GET /ios-go)
  fastify.get('/ios-go', async (_request, reply) => {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NOVYX GreenOps - Expo Go</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; margin: 0; background: #faf7ef; color: #153d2b; text-align: center; padding: 24px; box-sizing: border-box; }
    .card { background: white; border: 1px solid #c8e8cd; border-radius: 24px; padding: 32px 24px; max-width: 380px; width: 100%; box-shadow: 0 8px 24px rgba(21, 61, 43, 0.08); }
    h1 { font-size: 26px; margin: 0 0 8px; color: #153d2b; }
    p { font-size: 14px; color: #4a5568; line-height: 1.5; margin: 0 0 24px; }
    .btn { background: #15803d; color: white; padding: 16px 28px; border-radius: 14px; font-weight: 600; text-decoration: none; font-size: 16px; display: block; box-shadow: 0 4px 12px rgba(21, 128, 61, 0.28); }
    .hint { font-size: 12px; color: #718096; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>NOVYX GreenOps</h1>
    <p>Chạm nút bên dưới để mở ứng dụng trong Expo Go:</p>
    <a class="btn" href="exp://4fcn7he-peaker-8082.exp.direct">Mở trong Expo Go</a>
    <div class="hint">Đang tự động chuyển hướng...</div>
  </div>
  <script>
    setTimeout(function() {
      window.location.href = "exp://4fcn7he-peaker-8082.exp.direct";
    }, 400);
  </script>
</body>
</html>`;
    return reply.type('text/html').send(html);
  });

  // Operational Readiness check (GET /ready)
  fastify.get('/ready', async (_request, reply) => {
    if (!options.pool) {
      return reply.status(503).send({
        status: 'unavailable',
        database: 'not_configured',
      });
    }

    const isConnected = await checkDbConnection(options.pool);
    if (!isConnected) {
      return reply.status(503).send({
        status: 'unavailable',
        database: 'disconnected',
      });
    }

    return reply.status(200).send({
      status: 'ok',
      database: 'connected',
    });
  });
};
