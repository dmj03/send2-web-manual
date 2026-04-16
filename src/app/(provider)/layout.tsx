/**
 * Provider route-group layout.
 *
 * Covers: /providers, /providers/[slug]
 * Public — no auth required. The root layout already renders <Navbar>;
 * this layout adds no extra chrome but isolates the route group so that
 * ISR revalidation and metadata cascade correctly.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Providers — Send2',
    default: 'Money Transfer Providers — Send2',
  },
};

export default function ProviderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
