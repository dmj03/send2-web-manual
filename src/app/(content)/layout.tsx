import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Send2 Blog',
    default: 'Blog & News — Send2',
  },
  description:
    'Money transfer guides, exchange rate news, provider reviews, and tips to help you send money smarter.',
};

export default function ContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
