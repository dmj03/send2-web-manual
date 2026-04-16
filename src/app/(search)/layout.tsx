import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Send2 — Compare Money Transfers',
    default: 'Compare Money Transfers | Send2',
  },
  description:
    'Compare live exchange rates and fees from 50+ money transfer providers. Find the cheapest way to send money abroad.',
};

interface SearchLayoutProps {
  children: React.ReactNode;
}

export default function SearchLayout({ children }: SearchLayoutProps) {
  return <>{children}</>;
}
