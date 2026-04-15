import { World, IWorldOptions } from '@cucumber/cucumber';
import type { Express } from 'express';
import type supertest from 'supertest';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { JwtHelper } from './jwt-helper';

export class TestWorld extends World {
  /** Most recent HTTP response */
  lastResponse: supertest.Response | null = null;

  /** Most recent error (for non-HTTP error tracking) */
  lastError: Error | null = null;

  /** Query result storage (for readmodel-then verification) */
  queryResult: unknown = null;

  /** Entity ID map: natural key → generated ID (e.g., { "小明": 1 }) */
  ids: Record<string, string | number> = {};

  /** General-purpose memo storage */
  memo: Record<string, unknown> = {};

  /** Drizzle ORM database instance (injected in Before hook) */
  db!: NodePgDatabase;

  /** Express app instance (injected in Before hook) */
  app!: Express;

  /** JWT helper for generating test tokens (injected in Before hook) */
  jwtHelper!: JwtHelper;

  constructor(options: IWorldOptions) {
    super(options);
  }
}
