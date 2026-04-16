import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import { NotificationList } from '../NotificationList';
import { mockNotifications } from '@/__mocks__/fixtures/notifications';

// ─── Mock global hooks ────────────────────────────────────────────────────────

const mockUseNotificationsQuery = vi.fn();
const mockMarkReadMutate = vi.fn();
const mockMarkAllReadMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/hooks/notifications', () => ({
  useNotificationsQuery: () => mockUseNotificationsQuery(),
  useMarkReadMutation: () => ({
    mutate: mockMarkReadMutate,
    isPending: false,
  }),
  useMarkAllReadMutation: () => ({
    mutate: mockMarkAllReadMutate,
    isPending: false,
  }),
}));

vi.mock('../../hooks/useDeleteNotificationMutation', () => ({
  useDeleteNotificationMutation: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup(queryResult: object) {
  mockUseNotificationsQuery.mockReturnValue(queryResult);
  return renderWithProviders(<NotificationList />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton while loading', () => {
    setup({ data: undefined, isPending: true, isError: false, error: null });
    expect(screen.getByLabelText('Loading notifications')).toBeInTheDocument();
  });

  it('renders error state on failure', () => {
    setup({
      data: undefined,
      isPending: false,
      isError: true,
      error: { message: 'Network error' },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders empty state when no notifications', () => {
    setup({ data: [], isPending: false, isError: false, error: null });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('renders notification items', () => {
    setup({ data: mockNotifications, isPending: false, isError: false, error: null });
    const items = screen.getAllByTestId('notification-item');
    expect(items).toHaveLength(mockNotifications.length);
  });

  it('shows unread count badge on Unread tab', () => {
    const unread = mockNotifications.filter((n) => !n.isRead);
    setup({ data: mockNotifications, isPending: false, isError: false, error: null });
    const badge = screen.getByLabelText(`${unread.length} unread`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(String(unread.length));
  });

  it('filters to unread only when Unread tab is clicked', async () => {
    const user = userEvent.setup();
    setup({ data: mockNotifications, isPending: false, isError: false, error: null });

    await user.click(screen.getByRole('tab', { name: /unread/i }));

    const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
    const items = screen.getAllByTestId('notification-item');
    expect(items).toHaveLength(unreadCount);
  });

  it('calls markAllRead when "Mark all as read" is clicked', async () => {
    const user = userEvent.setup();
    setup({ data: mockNotifications, isPending: false, isError: false, error: null });

    await user.click(screen.getByText('Mark all as read'));
    expect(mockMarkAllReadMutate).toHaveBeenCalledTimes(1);
  });

  it('calls markRead with the correct id', async () => {
    const user = userEvent.setup();
    const unread = mockNotifications.filter((n) => !n.isRead);
    setup({ data: mockNotifications, isPending: false, isError: false, error: null });

    const markReadBtn = screen.getAllByRole('button', { name: /mark.*read/i })[0]!;
    await user.click(markReadBtn);

    expect(mockMarkReadMutate).toHaveBeenCalledWith(unread[0]!.id);
  });

  it('shows empty state for unread filter when all are read', async () => {
    const user = userEvent.setup();
    const allRead = mockNotifications.map((n) => ({ ...n, isRead: true }));
    setup({ data: allRead, isPending: false, isError: false, error: null });

    await user.click(screen.getByRole('tab', { name: /unread/i }));

    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('does not show "Mark all as read" when all notifications are read', () => {
    const allRead = mockNotifications.map((n) => ({ ...n, isRead: true }));
    setup({ data: allRead, isPending: false, isError: false, error: null });
    expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
  });
});
