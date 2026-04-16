/**
 * Public group layout — standard site shell with header and footer.
 *
 * Covers: /, /search, /providers/*, /blog/*, /news/*, /about-us, /contact-us
 *
 * The root layout supplies <html>, <body>, and <Providers>.
 * This layout adds the site-wide Navbar + Footer for all public routes.
 * Route-specific layouts (e.g. (home)) can nest further inside this shell.
 */

import { Navbar } from '@/components/navigation';
import { Footer } from '@/components/navigation';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
