/**
 * Test data factory pattern.
 *
 * Each aggregate gets its own factory file, e.g.:
 *   src/test/factories/lesson-progress.factory.ts
 *
 * Factory functions create type-safe test data with sensible defaults.
 * Override specific fields per test scenario.
 *
 * Example:
 * ```typescript
 * // lesson-progress.factory.ts
 * import type { LessonProgress } from '@/lib/types/schemas';
 *
 * let counter = 0;
 *
 * export function mockLessonProgress(
 *   overrides: Partial<LessonProgress> = {},
 * ): LessonProgress {
 *   counter += 1;
 *   return {
 *     id: `lp-${counter}`,
 *     userId: `user-${counter}`,
 *     lessonId: counter,
 *     progress: 0,
 *     status: 'NOT_STARTED',
 *     updatedAt: new Date().toISOString(),
 *     ...overrides,
 *   };
 * }
 * ```
 */

// Export all factory functions here as they are created:
// export { mockLessonProgress } from './lesson-progress.factory';
