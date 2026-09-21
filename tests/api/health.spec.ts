import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../../apps/api/src/app';

describe('Phase 13 Wave 2: Backend Runtime Foundation — Health Endpoint', () => {
  const app = buildApp({ logger: false });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns HTTP 200 with status "ok"', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload).toEqual({ status: 'ok' });
  });

  it('GET /health does NOT leak database credentials or internal config', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    const body = response.body.toLowerCase();
    expect(body).not.toContain('password');
    expect(body).not.toContain('postgres');
    expect(body).not.toContain('connection');
    expect(body).not.toContain('secret');
  });

  it('GET /ready returns HTTP 503 unavailable and database "not_configured" when pool is omitted', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    expect(response.statusCode).toBe(503);
    const payload = JSON.parse(response.body);
    expect(payload).toEqual({
      status: 'unavailable',
      database: 'not_configured',
    });
  });
});
