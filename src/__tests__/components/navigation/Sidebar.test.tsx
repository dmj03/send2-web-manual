import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore, type AuthUser } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

// ── Next.js module mocks ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Import after mocks
import { Sidebar } from '@/components/navigation/Sidebar';
import { usePathname } from 'next/navigation';

const mockAuthUser: AuthUser = {
  id: 'usr_sidebar_test',
  email: 'james@example.com',
  firstName: 'James',
  lastName: 'Okafor',
  phone: null,
  countryCode: 'GB',
  profileImageUrl: null,
  isEmailVerified: true,
  isPhoneVerified: false,
  firestoreUid: null,
  socialProvider: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue('/');
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: false,
    isProfileImageUpdating: false,
    referralCode: null,
    error: null,
  });
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Renders the desktop sidebar (always visible in DOM, hidden on mobile via CSS). */
function renderSidebar(props: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  return {
    onClose,
    ...render(<Sidebar open={props.open ?? false} onClose={onClose} />),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Sidebar — nav items (unauthenticated)', () => {
  it('renders public nav items (Home, Search, Compare)', () => {
    renderSidebar();
    // Desktop sidebar always renders nav — check by aria-label
    const nav = screen.getAllByRole('navigation', { name: /sidebar navigation/i });
    expect(nav.length).toBeGreaterThan(0);

    // Public links should be visible
    const links = screen.getAllByRole('link');
    const hrefs = links.map((el) => el.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/search');
    expect(hrefs).toContain('/compare');
  });

  it('does NOT render auth-required items when unauthenticated', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((el) => el.getAttribute('href'));
    expect(hrefs).not.toContain('/rate-alerts');
    expect(hrefs).not.toContain('/notifications');
    expect(hrefs).not.toContain('/personal-info');
    expect(hrefs).not.toContain('/settings');
  });
});

describe('Sidebar — nav items (authenticated)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
  });

  it('renders auth-required items when user is logged in', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((el) => el.getAttribute('href'));
    expect(hrefs).toContain('/rate-alerts');
    expect(hrefs).toContain('/notifications');
    expect(hrefs).toContain('/personal-info');
    expect(hrefs).toContain('/settings');
  });

  it('renders all 7 nav items when authenticated', () => {
    renderSidebar();
    // Desktop sidebar renders nav — 7 items: Home, Search, Compare, Rate Alerts, Notifications, Profile, Settings
    // They appear in the desktop aside AND mobile panel (when open), so count per nav
    const nav = screen.getAllByRole('navigation', { name: /sidebar navigation/i });
    // At least one nav with all items
    const firstNav = nav[0];
    const links = Array.from(firstNav.querySelectorAll('a'));
    expect(links.length).toBe(7);
  });
});

describe('Sidebar — notification badge', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
  });

  it('does NOT show badge when unreadCount is 0', () => {
    useNotificationStore.setState({ unreadCount: 0 });
    renderSidebar();
    // Badge is a span inside the notifications link — it should not exist
    const notifLink = screen.getAllByRole('link').find(
      (el) => el.getAttribute('href') === '/notifications',
    );
    expect(notifLink).toBeDefined();
    // No badge span with a number
    expect(notifLink!.querySelector('span.rounded-full')).toBeNull();
  });

  it('shows badge with count when unreadCount > 0', () => {
    useNotificationStore.setState({ unreadCount: 5 });
    renderSidebar();
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
  });

  it('shows 99+ badge when unreadCount exceeds 99', () => {
    useNotificationStore.setState({ unreadCount: 150 });
    renderSidebar();
    expect(screen.getAllByText('99+').length).toBeGreaterThan(0);
  });

  it('shows exact count when unreadCount is exactly 99', () => {
    useNotificationStore.setState({ unreadCount: 99 });
    renderSidebar();
    expect(screen.getAllByText('99').length).toBeGreaterThan(0);
  });
});

describe('Sidebar — mobile overlay', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
  });

  it('does not render the mobile dialog when open=false', () => {
    renderSidebar({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the mobile dialog when open=true', () => {
    renderSidebar({ open: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ open: true });

    const closeBtn = screen.getByRole('button', { name: /close navigation menu/i });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop overlay is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ open: true });

    // The backdrop is a div with aria-hidden="true" — click it
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).not.toBeNull();
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key when open', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ open: true });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});

describe('Sidebar — active link state', () => {
  it('marks / as active when pathname is /', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    renderSidebar();

    const links = screen.getAllByRole('link');
    const homeLink = links.find((el) => el.getAttribute('href') === '/');
    expect(homeLink?.getAttribute('aria-current')).toBe('page');
  });

  it('marks /search as active when pathname starts with /search', () => {
    vi.mocked(usePathname).mockReturnValue('/search?q=test');
    renderSidebar();

    const links = screen.getAllByRole('link');
    const searchLink = links.find((el) => el.getAttribute('href') === '/search');
    expect(searchLink?.getAttribute('aria-current')).toBe('page');
  });

  it('does not mark / as active when on /search', () => {
    vi.mocked(usePathname).mockReturnValue('/search');
    renderSidebar();

    const links = screen.getAllByRole('link');
    // There may be multiple / links (desktop + mobile), none should be page on /search
    const homeLinks = links.filter((el) => el.getAttribute('href') === '/');
    homeLinks.forEach((link) => {
      expect(link.getAttribute('aria-current')).not.toBe('page');
    });
  });
});

describe('Sidebar — route change closes mobile sidebar', () => {
  it('calls onClose when pathname changes', () => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
    const onClose = vi.fn();
    const { rerender } = render(<Sidebar open={true} onClose={onClose} />);

    // Simulate a route change by re-rendering with a different mock pathname
    vi.mocked(usePathname).mockReturnValue('/search');
    rerender(<Sidebar open={true} onClose={onClose} />);

    // onClose is called by the useEffect that watches pathname
    expect(onClose).toHaveBeenCalled();
  });
});
