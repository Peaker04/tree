import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../apps/api/src/infrastructure/persistence/schema';
import { eq } from 'drizzle-orm';
import { execSync } from 'child_process';
import { buildApp } from '../../apps/api/src/app';

const { Pool } = pg;

describe('P2: Real Local Dev Users Seeding & Connectivity', () => {
  const runtimeUrl = process.env['DATABASE_RUNTIME_URL'];
  const hasDatabase = Boolean(runtimeUrl);

  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    if (!hasDatabase) return;
    pool = new Pool({ connectionString: runtimeUrl });
    db = drizzle(pool, { schema });

    process.env.NOVYX_DEV_STAFF_EMAIL = 'staff@novyx.local';
    process.env.NOVYX_DEV_MANAGER_EMAIL = 'manager@novyx.local';
    process.env.NOVYX_DEV_PASSWORD = 'devPassword123';
    process.env.NODE_ENV = 'test';

    execSync('npm run db:seed:dev --workspace @novyx/api', { stdio: 'inherit', env: process.env });

    app = buildApp({ pool });
    await app.ready();
  });

  afterAll(async () => {
    if (!hasDatabase) return;
    await app.close();
    await pool.end();
  });

  it('T1: seeded Staff logs in with correct password and fails with wrong', async () => {
    if (!hasDatabase) return;

    const wrongRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'staff@novyx.local', password: 'wrong' },
    });
    expect(wrongRes.statusCode).toBe(401);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'staff@novyx.local', password: 'devPassword123' },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.session?.user?.role || json.data?.session?.user?.role).toBe('staff');
  });

  it('T2: seeded Manager logs in, has operational scope, and seed is idempotent', async () => {
    if (!hasDatabase) return;

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { identifier: 'manager@novyx.local', password: 'devPassword123' },
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.session.user.role).toBe('manager');

    const managerId = json.session.user.id;
    const scopes = await db
      .select()
      .from(schema.managerOperationalScopes)
      .where(eq(schema.managerOperationalScopes.managerId, managerId));
    expect(scopes.length).toBe(1);
    expect(scopes[0].scopeKey).toBe('GLOBAL');

    const initialUserCount = (await db.select().from(schema.users)).length;

    // Rerun seed script
    execSync('npm run db:seed:dev --workspace @novyx/api', { stdio: 'inherit', env: process.env });

    // Check invariants
    const finalUserCount = (await db.select().from(schema.users)).length;
    expect(finalUserCount).toBe(initialUserCount);

    const finalStaffCount = (await db.select().from(schema.users).where(eq(schema.users.email, 'staff@novyx.local')))
      .length;
    expect(finalStaffCount).toBe(1);

    const finalManagerCount = (
      await db.select().from(schema.users).where(eq(schema.users.email, 'manager@novyx.local'))
    ).length;
    expect(finalManagerCount).toBe(1);

    const finalScopes = await db
      .select()
      .from(schema.managerOperationalScopes)
      .where(eq(schema.managerOperationalScopes.managerId, managerId));
    expect(finalScopes.length).toBe(1);

    const finalTreeCount = (await db.select().from(schema.trees).where(eq(schema.trees.id, 'TRE-DEV-01'))).length;
    expect(finalTreeCount).toBe(1);

    const finalTTCount = (await db.select().from(schema.taskTypes).where(eq(schema.taskTypes.id, 'TT-DEV-01'))).length;
    expect(finalTTCount).toBe(1);
  });
});
