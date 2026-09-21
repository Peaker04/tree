import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/persistence/schema/index.ts',
  out: './src/infrastructure/persistence/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env['DATABASE_MIGRATION_URL'] ?? 'postgresql://novyx_admin:novyx_dev_password@localhost:5432/novyx_dev',
  },
});
