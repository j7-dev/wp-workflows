import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './${NODE_DB_SCHEMA}',
  out: './${NODE_DRIZZLE_MIGRATIONS}',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/${DB_NAME}',
  },
});
