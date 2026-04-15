import express, { Express } from 'express';
import cors from 'cors';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { errorHandler } from './middleware/error-handler';
import { routes } from './routes';

export function createApp(db: NodePgDatabase): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1', routes(db));

  app.use(errorHandler);

  return app;
}
