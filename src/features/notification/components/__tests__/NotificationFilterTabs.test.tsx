import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationFilterTabs } from '../NotificationFilterTabs';

describe('NotificationFilterTabs', () => {
  it('renders All and Unread tabs', () => {
    render(<NotificationFilterTabs active="all" unreadCount={0} onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected=true', () => {
    render(<NotificationFilterTabs active="unread" unreadCount={3} onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false');
  });

  it('shows badge with unread count', () => {
    render(<NotificationFilterTabs active="all" unreadCount={5} onChange={vi.fn()} />);
    expect(screen.getByLabelText('5 unread')).toBeInTheDocument();
  });

  it('does not show badge when unread count is 0', () => {
    render(<NotificationFilterTabs active="all" unreadCount={0} onChange={vi.fn()} />);
    expect(screen.queryByLabelText(/unread/)).not.toBeInTheDocument();
  });

  it('calls onChange with correct value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NotificationFilterTabs active="all" unreadCount={2} onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: /unread/i }));
    expect(onChange).toHaveBeenCalledWith('unread');
  });

  it('caps badge at 99+', () => {
    render(<NotificationFilterTabs active="all" unreadCount={150} onChange={vi.fn()} />);
    expect(screen.getByLabelText('150 unread')).toHaveTextContent('99+');
  });
});
