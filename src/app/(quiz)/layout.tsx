import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    template: '%s | Find Your Provider | Send2',
    default: 'Find Your Provider | Send2',
  },
  description:
    'Answer 5 quick questions and get personalised money transfer recommendations tailored to your needs.',
};

interface QuizLayoutProps {
  children: React.ReactNode;
}

/**
 * Quiz route group layout.
 *
 * Intentionally minimal — no full site header/footer so the wizard can
 * take full focus. Provides a slim top bar with logo and a link back home.
 */
export default function QuizLayout({ children }: QuizLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Slim top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:opacity-80 transition-opacity"
            aria-label="Send2 — go to homepage"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-extrabold text-white"
              aria-hidden="true"
            >
              S2
            </span>
            Send2
          </Link>

          <Link
            href="/search"
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            Advanced search
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main id="quiz-main" className="flex flex-1 flex-col items-center justify-start px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      {/* Slim footer */}
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Send2. Rates are indicative and subject to change.
          </p>
          <nav aria-label="Footer links" className="flex gap-4">
            <Link href="/about-us" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              About
            </Link>
            <Link href="/contact-us" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
