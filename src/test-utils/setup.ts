import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/__mocks__/server';

beforeAll(() =>
  server.listen({
    // Fail fast on any request that has no matching handler —
    // catches accidental real-network calls or missing mocks.
    onUnhandledRequest: 'error',
  }),
);

afterEach(() => {
  // Reset handlers back to defaults after each test so overrides
  // in one test don't bleed into the next.
  server.resetHandlers();
});

afterAll(() => server.close());
