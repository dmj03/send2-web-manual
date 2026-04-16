import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Send2',
    default: 'Send2',
  },
};

export default function MiscLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
