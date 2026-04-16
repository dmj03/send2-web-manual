import type { ArticleCategory } from '@/types/content';

export const contentQueryKeys = {
  all: ['content'] as const,
  articles: () => [...contentQueryKeys.all, 'articles'] as const,
  articleList: (category?: ArticleCategory, page?: number) =>
    [...contentQueryKeys.articles(), { category, page }] as const,
  articleDetail: (slug: string) =>
    [...contentQueryKeys.articles(), 'detail', slug] as const,
  promotions: () => [...contentQueryKeys.all, 'promotions'] as const,
  promotionList: (providerId?: string) =>
    [...contentQueryKeys.promotions(), { providerId }] as const,
} as const;
