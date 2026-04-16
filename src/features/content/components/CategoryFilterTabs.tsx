'use client';

import type { ArticleCategory } from '@/types/content';

interface CategoryTab {
  value: ArticleCategory | undefined;
  label: string;
}

const BLOG_TABS: CategoryTab[] = [
  { value: undefined, label: 'All' },
  { value: 'guides', label: 'Guides' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'tips', label: 'Tips' },
  { value: 'promotions', label: 'Promotions' },
];

const NEWS_TABS: CategoryTab[] = [
  { value: undefined, label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'currency-news', label: 'Currency News' },
];

interface CategoryFilterTabsProps {
  selected: ArticleCategory | undefined;
  onChange: (category: ArticleCategory | undefined) => void;
  variant?: 'blog' | 'news';
}

export function CategoryFilterTabs({
  selected,
  onChange,
  variant = 'blog',
}: CategoryFilterTabsProps) {
  const tabs = variant === 'news' ? NEWS_TABS : BLOG_TABS;

  return (
    <div
      role="tablist"
      aria-label="Filter articles by category"
      className="flex flex-wrap gap-2"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === selected;
        return (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
