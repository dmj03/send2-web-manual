'use client';

import { useState, useCallback } from 'react';
import { useArticlesQuery } from '@/hooks/content/useArticlesQuery';
import type { Article, ArticleCategory } from '@/types/content';
import { ArticleCard } from './ArticleCard';
import { ArticleGridSkeleton } from './ContentSkeletons';
import { CategoryFilterTabs } from './CategoryFilterTabs';

interface ArticleGridClientProps {
  /** Articles pre-fetched server-side for the initial render (SEO). */
  initialArticles: Article[];
  /** Restrict categories shown in the filter tabs. */
  variant?: 'blog' | 'news';
  /** Lock the category filter to specific values (news page forces news categories). */
  lockedCategory?: ArticleCategory;
}

export function ArticleGridClient({
  initialArticles,
  variant = 'blog',
  lockedCategory,
}: ArticleGridClientProps) {
  const [category, setCategory] = useState<ArticleCategory | undefined>(
    lockedCategory,
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useArticlesQuery(category);

  // Merge pages — fall back to server-rendered initial articles while loading
  const articles: Article[] =
    data?.pages.flatMap((page) => page.articles) ?? initialArticles;

  const handleCategoryChange = useCallback(
    (next: ArticleCategory | undefined) => {
      if (lockedCategory !== undefined) return; // locked — ignore
      setCategory(next);
    },
    [lockedCategory],
  );

  return (
    <div>
      {lockedCategory === undefined && (
        <div className="mb-6">
          <CategoryFilterTabs
            selected={category}
            onChange={handleCategoryChange}
            variant={variant}
          />
        </div>
      )}

      {isPending ? (
        <ArticleGridSkeleton count={9} />
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
          <p className="text-sm font-medium text-gray-600">No articles found.</p>
          <p className="mt-1 text-xs text-gray-400">
            Try selecting a different category.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                basePath={variant === 'news' ? '/news' : '/blog'}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingNextPage ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading…
                  </>
                ) : (
                  'Load more articles'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
