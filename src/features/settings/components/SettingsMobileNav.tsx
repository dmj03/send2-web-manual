'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/navigation';

const navItems = [
  { href: ROUTES.settings.index, label: 'Overview' },
  { href: ROUTES.settings.account, label: 'Account' },
  { href: ROUTES.settings.security, label: 'Security' },
  { href: ROUTES.settings.preferences, label: 'Preferences' },
  { href: ROUTES.settings.notifications, label: 'Notifications' },
  { href: ROUTES.settings.privacy, label: 'Privacy' },
];

export function SettingsMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings navigation"
      className="border-b border-gray-200 bg-white"
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6">
        <ul className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive =
              item.href === ROUTES.settings.index
                ? pathname === ROUTES.settings.index
                : pathname.startsWith(item.href);

            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href as Route}
                  aria-current={isActive ? 'page' : undefined}
                  className={`block rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
