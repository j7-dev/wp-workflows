import { Router } from 'express';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export function routes(_db: NodePgDatabase): Router {
  const router = Router();

  // Register domain routes here
  // Example:
  // router.use('/lessons', lessonRoutes(_db));

  return router;
}
