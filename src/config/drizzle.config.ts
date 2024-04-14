import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  strict: true,
  verbose: true,
  driver: 'pg',
  out: './src/database/migrations',
  schema: './src/database/schema.database.ts',
  introspect: { casing: 'preserve' },
  dbCredentials: { connectionString: process.env.DATABASE_URL as string }
});
