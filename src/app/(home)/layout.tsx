import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send2 — Compare Money Transfer Services',
  description:
    'Find the best exchange rates and lowest fees for international money transfers. Compare 50+ providers in seconds.',
  openGraph: {
    title: 'Send2 — Compare Money Transfer Services',
    description:
      'Find the best exchange rates and lowest fees for international money transfers.',
    type: 'website',
  },
};

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return <>{children}</>;
}
