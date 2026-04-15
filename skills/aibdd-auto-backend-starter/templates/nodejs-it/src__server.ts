import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createApp } from './app';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/${DB_NAME}',
});

const db = drizzle(pool);
const app = createApp(db);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
