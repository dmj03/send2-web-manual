import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Node server for Vitest and server-side rendering tests.
 * Imported and started by src/test-utils/setup.ts.
 */
export const server = setupServer(...handlers);
