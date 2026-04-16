/**
 * UI primitive domain types.
 * Covers toasts, modals, theming, and breadcrumb navigation.
 */

/** Visual severity variants for a toast notification. */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Active colour theme. */
export type Theme = 'light' | 'dark' | 'system';

/** An inline CTA that can be attached to a toast. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/** A toast notification entry managed by the UI store. */
export interface Toast {
  /** Unique identifier used for deduplication and dismissal. */
  id: string;
  type: ToastType;
  title: string;
  message: string;
  /** Auto-dismiss duration in milliseconds; 0 means persist until dismissed. */
  duration: number;
  action?: ToastAction;
}

/** Configuration passed to the global modal imperatively. */
export interface ModalConfig {
  title: string;
  /** Modal body — string for simple text, ReactNode for rich content (typed as unknown to avoid React dep here). */
  content: unknown;
  /** Label for the confirm/primary button. */
  confirmLabel?: string;
  /** Label for the cancel button; omit to hide cancel. */
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  /** If true, the modal cannot be dismissed by clicking the backdrop. */
  persistent?: boolean;
}

/** A single breadcrumb entry rendered in page-level breadcrumb trails. */
export interface Breadcrumb {
  label: string;
  /** Href to navigate to; omit for the current (non-linked) crumb. */
  href?: string;
}
