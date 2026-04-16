import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryFilterTabs } from '../CategoryFilterTabs';
import type { ArticleCategory } from '@/types/content';

describe('CategoryFilterTabs', () => {
  it('renders all blog tabs', () => {
    render(
      <CategoryFilterTabs selected={undefined} onChange={vi.fn()} variant="blog" />,
    );
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Guides' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tips' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Promotions' })).toBeInTheDocument();
  });

  it('renders news tabs when variant is news', () => {
    render(
      <CategoryFilterTabs selected={undefined} onChange={vi.fn()} variant="news" />,
    );
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'News' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Currency News' })).toBeInTheDocument();
  });

  it('marks the selected tab as aria-selected', () => {
    render(
      <CategoryFilterTabs
        selected={'guides' as ArticleCategory}
        onChange={vi.fn()}
        variant="blog"
      />,
    );
    expect(screen.getByRole('tab', { name: 'Guides' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('calls onChange with the category value when a tab is clicked', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterTabs selected={undefined} onChange={onChange} variant="blog" />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Reviews' }));
    expect(onChange).toHaveBeenCalledWith('reviews');
  });

  it('calls onChange with undefined when "All" tab is clicked', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilterTabs
        selected={'guides' as ArticleCategory}
        onChange={onChange}
        variant="blog"
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'All' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
