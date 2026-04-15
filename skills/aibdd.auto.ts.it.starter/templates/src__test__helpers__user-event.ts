import userEvent from '@testing-library/user-event';

/**
 * Pre-configured userEvent instance.
 * Use `createUser()` for a fresh instance per test.
 */
export function createUser() {
  return userEvent.setup();
}
