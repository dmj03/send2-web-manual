import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationItem } from '../NotificationItem';
import { mockNotification, mockNotifications } from '@/__mocks__/fixtures/notifications';

const readNotification = { ...mockNotification, isRead: true };
const unreadNotification = { ...mockNotification, isRead: false };
const notificationWithAction = {
  ...mockNotification,
  isRead: false,
  actionUrl: '/rate-alerts',
};

function setup(props?: Partial<Parameters<typeof NotificationItem>[0]>) {
  const defaults = {
    notification: unreadNotification,
    onMarkRead: vi.fn(),
    onDelete: vi.fn(),
    isMarking: false,
    isDeleting: false,
  };
  return {
    ...render(<NotificationItem {...defaults} {...props} />),
    onMarkRead: (props?.onMarkRead as ReturnType<typeof vi.fn>) ?? defaults.onMarkRead,
    onDelete: (props?.onDelete as ReturnType<typeof vi.fn>) ?? defaults.onDelete,
  };
}

describe('NotificationItem', () => {
  it('renders the notification title and body', () => {
    setup();
    expect(screen.getByText(unreadNotification.title)).toBeInTheDocument();
    expect(screen.getByText(unreadNotification.body)).toBeInTheDocument();
  });

  it('shows unread dot for unread notifications', () => {
    const { container } = render(
      <NotificationItem
        notification={unreadNotification}
        onMarkRead={vi.fn()}
        onDelete={vi.fn()}
        isMarking={false}
        isDeleting={false}
      />,
    );
    // unread dot has opacity-100 class
    const dot = container.querySelector('.opacity-100');
    expect(dot).not.toBeNull();
  });

  it('hides unread dot for read notifications', () => {
    const { container } = render(
      <NotificationItem
        notification={readNotification}
        onMarkRead={vi.fn()}
        onDelete={vi.fn()}
        isMarking={false}
        isDeleting={false}
      />,
    );
    const dot = container.querySelector('.opacity-0');
    expect(dot).not.toBeNull();
  });

  it('shows "Mark read" button for unread notifications', () => {
    setup({ notification: unreadNotification });
    expect(screen.getByRole('button', { name: /mark.*read/i })).toBeInTheDocument();
  });

  it('hides "Mark read" button for already-read notifications', () => {
    setup({ notification: readNotification });
    expect(screen.queryByRole('button', { name: /mark.*read/i })).not.toBeInTheDocument();
  });

  it('calls onMarkRead with the notification id', async () => {
    const user = userEvent.setup();
    const onMarkRead = vi.fn();
    setup({ notification: unreadNotification, onMarkRead });

    await user.click(screen.getByRole('button', { name: /mark.*read/i }));
    expect(onMarkRead).toHaveBeenCalledWith(unreadNotification.id);
  });

  it('calls onDelete with the notification id', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    setup({ notification: unreadNotification, onDelete });

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(unreadNotification.id);
  });

  it('disables Mark read button when isMarking', () => {
    setup({ isMarking: true });
    expect(screen.getByRole('button', { name: /mark.*read/i })).toBeDisabled();
  });

  it('disables delete button when isDeleting', () => {
    setup({ isDeleting: true });
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('renders a View link when actionUrl is set', () => {
    setup({ notification: notificationWithAction });
    const link = screen.getByRole('link', { name: /view/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/rate-alerts');
  });

  it('does not render View link when actionUrl is null', () => {
    setup({ notification: { ...unreadNotification, actionUrl: null } });
    expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument();
  });

  it('renders a notification for each type from fixtures', () => {
    mockNotifications.forEach((n) => {
      const { unmount } = render(
        <NotificationItem
          notification={n}
          onMarkRead={vi.fn()}
          onDelete={vi.fn()}
          isMarking={false}
          isDeleting={false}
        />,
      );
      expect(screen.getByText(n.title)).toBeInTheDocument();
      unmount();
    });
  });
});
