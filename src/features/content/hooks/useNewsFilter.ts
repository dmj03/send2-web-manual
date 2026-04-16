'use client';

import { useState, useCallback } from 'react';
import type { ArticleCategory } from '@/types/content';

const NEWS_CATEGORIES: ArticleCategory[] = ['news', 'currency-news'];

interface UseNewsFilterReturn {
  category: ArticleCategory | undefined;
  setCategory: (category: ArticleCategory | undefined) => void;
  newsCategories: ArticleCategory[];
}

/**
 * Manages the active category filter for the news listing page.
 * Only permits selecting from the two news-specific categories.
 */
export function useNewsFilter(): UseNewsFilterReturn {
  const [category, setRawCategory] = useState<ArticleCategory | undefined>(
    undefined,
  );

  const setCategory = useCallback((next: ArticleCategory | undefined) => {
    if (next !== undefined && !NEWS_CATEGORIES.includes(next)) return;
    setRawCategory(next);
  }, []);

  return { category, setCategory, newsCategories: NEWS_CATEGORIES };
}
