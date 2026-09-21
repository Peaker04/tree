import { defineConfig } from 'drizzle-kit';

const migrationUrl = process.env['DATABASE_MIGRATION_URL'];
if (!migrationUrl) {
  throw new Error('DATABASE_MIGRATION_URL is required to run drizzle-kit operations');
}

export default defineConfig({
  schema: './src/infrastructure/persistence/schema/index.ts',
  out: './src/infrastructure/persistence/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
});
