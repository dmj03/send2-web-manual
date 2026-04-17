'use client';

import { useEffect, useState } from 'react';

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    process.env.NODE_ENV !== 'development' || process.env['NEXT_PUBLIC_USE_MOCKS'] !== 'true'
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && process.env['NEXT_PUBLIC_USE_MOCKS'] === 'true') {
      import('@/__mocks__/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => setReady(true));
      });
    }
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
