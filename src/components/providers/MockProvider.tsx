'use client';

import { useEffect } from 'react';

export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && process.env['NEXT_PUBLIC_USE_MOCKS'] === 'true') {
      import('@/__mocks__/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' });
      });
    }
  }, []);

  return <>{children}</>;
}
