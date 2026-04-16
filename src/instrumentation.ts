export async function register() {
  if (
    process.env['NEXT_PUBLIC_USE_MOCKS'] === 'true' &&
    process.env.NODE_ENV === 'development'
  ) {
    const { server } = await import('./__mocks__/server');
    server.listen({ onUnhandledRequest: 'bypass' });
    console.log('[MSW] Server-side mock server started');
  }
}
