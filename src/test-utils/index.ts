// Re-export everything from RTL so tests only need to import from one place.
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Override render with our provider-wrapped version
export { renderWithProviders as render } from './render';

// Re-export server for tests that need to add per-test handler overrides
export { server } from '@/__mocks__/server';

// Fixture data — convenience re-export for tests
export * from '@/__mocks__/fixtures';
