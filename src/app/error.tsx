'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error boundary]', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      })
    }
    // In production, errors are reported via Sentry (configured in layout / instrumentation)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <svg
            className="h-8 w-8 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted">
            We ran into an unexpected problem. Please try again — if the issue
            persists, contact support.
          </p>
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p className="mt-2 font-mono text-xs text-muted">
              digest: {error.digest}
            </p>
          )}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2 text-left">
              <summary className="cursor-pointer text-xs text-muted">
                Error details
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-surface p-3 text-xs text-foreground">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try again
          </button>
          <Link
            href={"/" as import('next').Route}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
