/**
 * Navigation domain types.
 * Describes the shape of nav items used in Header, Footer, and sidebar menus.
 */

import type { UserRole } from './auth';

/** A single navigation link entry. */
export interface NavItem {
  /** Display label shown in the UI. */
  label: string;
  /** Absolute or relative href. */
  href: string;
  /** Icon identifier string (maps to an icon component), or null for text-only links. */
  icon: string | null;
  /** Optional badge text (e.g. notification count). */
  badge?: string | number;
  /** If true, the item is hidden for unauthenticated users. */
  requiresAuth: boolean;
  /** If set, only users with at least one matching role can see this item. */
  roles?: UserRole[];
  /** If true, renders with target="_blank" rel="noopener noreferrer". */
  isExternal: boolean;
}
