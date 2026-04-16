import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore, type AuthUser } from '@/stores/authStore';

// ── Next.js module mocks ────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) =>
    <img src={src} alt={alt} width={width} height={height} {...props} />,
}));

// Import after mocks are registered
import { Navbar } from '@/components/navigation/Navbar';
import { usePathname } from 'next/navigation';

const mockAuthUser: AuthUser = {
  id: 'usr_test',
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
});

describe('Navbar', () => {
  it('renders the Send2 logo text', () => {
    render(<Navbar />);
    expect(screen.getByText('Send2')).toBeInTheDocument();
  });

  it('renders the logo image with correct alt text', () => {
    render(<Navbar />);
    expect(screen.getByAltText('Send2')).toBeInTheDocument();
  });

  it('shows "Sign in" link when user is not authenticated', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not show Sign in when user is authenticated', () => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
    render(<Navbar />);
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('shows user menu button when authenticated', () => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
    render(<Navbar />);
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
  });

  it('renders main navigation links', () => {
    render(<Navbar />);
    // Desktop nav — these links are hidden on mobile via CSS but present in DOM
    const navLinks = screen.getAllByRole('link');
    const hrefs = navLinks.map((a) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/search');
  });

  it('marks active link with aria-current="page" on home route', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    render(<Navbar />);

    // The home link should have aria-current="page"
    const homeLink = screen.getByRole('link', { name: 'Send2 home' });
    // The desktop nav Home link
    const navLinks = screen.getAllByRole('link');
    const activeLink = navLinks.find(
      (el) => el.getAttribute('href') === '/' && el.getAttribute('aria-current') === 'page',
    );
    expect(activeLink).toBeDefined();
  });

  it('marks /search as active when pathname starts with /search', () => {
    vi.mocked(usePathname).mockReturnValue('/search');
    render(<Navbar />);

    const searchLinks = screen.getAllByRole('link');
    const activeSearch = searchLinks.find(
      (el) =>
        (el as HTMLAnchorElement).getAttribute('href') === '/search' &&
        el.getAttribute('aria-current') === 'page',
    );
    expect(activeSearch).toBeDefined();
  });

  it('user menu dropdown is not visible before clicking', () => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
    render(<Navbar />);
    // The dropdown menu items should not be in the DOM until opened
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('user menu dropdown opens on button click', async () => {
    useAuthStore.setState({ user: mockAuthUser, token: 'tok' });
    render(<Navbar />);

    const menuBtn = screen.getByRole('button', { name: /user menu/i });
    await userEvent.click(menuBtn);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
