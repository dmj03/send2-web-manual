import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW browser Service Worker for offline development and Storybook.
 *
 * Usage in app entry point (e.g. src/app/layout.tsx or src/instrumentation.ts):
 * ```ts
 * if (process.env.NODE_ENV === 'development') {
 *   const { worker } = await import('@/__mocks__/browser');
 *   await worker.start({ onUnhandledRequest: 'bypass' });
 * }
 * ```
 */
export const worker = setupWorker(...handlers);
