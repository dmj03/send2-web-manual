import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        {/* Large 404 */}
        <p className="text-8xl font-extrabold tracking-tight text-accent/20 select-none">
          404
        </p>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Check the URL or go back to the homepage.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={"/" as import('next').Route}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Go home
          </Link>
          <Link
            href={"/search" as import('next').Route}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/50"
          >
            Search providers
          </Link>
        </div>

        {/* Helpful links */}
        <div className="border-t border-border pt-6">
          <p className="mb-3 text-sm font-medium text-muted">Popular pages</p>
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {[
              { label: 'Compare rates', href: '/search' },
              { label: 'Providers', href: '/providers' },
              { label: 'Blog', href: '/blog' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href as import('next').Route}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
