'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from './Sidebar'

const NAV_LINKS = [
  { label: 'Home',   href: '/' },
  { label: 'Search', href: '/search' },
  { label: 'Deals',  href: '/providers' },
  { label: 'Blog',   href: '/blog' },
] as const

export function Navbar() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          {/* Hamburger — mobile */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground md:hidden"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href={"/" as import('next').Route}
            className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Send2 home"
          >
            <Image
              src="/logo.svg"
              alt="Send2"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
            <span className="hidden text-xl font-bold text-foreground sm:block">
              Send2
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive =
                href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href as import('next').Route}
                  className={[
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:bg-surface hover:text-foreground',
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right section */}
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link
                href={"/login" as import('next').Route}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}

/* ── User avatar dropdown ──────────────────────────────────────────────── */
interface UserMenuProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const logout = useAuthStore((s) => s.logout)

  const initials = user.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? 'User avatar'}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg ring-2 ring-border">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-border bg-background py-1 shadow-lg"
          >
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name ?? 'Account'}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            {[
              { label: 'Dashboard',    href: '/dashboard' },
              { label: 'Profile',      href: '/personal-info' },
              { label: 'Rate Alerts',  href: '/rate-alerts' },
              { label: 'Notifications', href: '/notifications' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href as import('next').Route}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface"
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-border pt-1">
              <button
                role="menuitem"
                onClick={() => { setOpen(false); logout() }}
                className="w-full px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-surface"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
