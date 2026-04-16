import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/types/api';
import { mockArticles, mockArticle, mockPromotions } from '../fixtures/content';

const BASE = '/content';

export const contentHandlers = [
  /** GET /content/articles — paginated list */
  http.get(`${BASE}/articles`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const perPage = Number(url.searchParams.get('perPage') ?? 12);
    const category = url.searchParams.get('category');

    const filtered = category
      ? mockArticles.filter((a) => a.category === category)
      : mockArticles;

    const start = (page - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);

    const payload: ApiResponse<typeof slice> = {
      data: slice,
      meta: {
        total: filtered.length,
        page,
        perPage,
        lastPage: Math.max(1, Math.ceil(filtered.length / perPage)),
        hasMore: start + perPage < filtered.length,
      },
    };

    return HttpResponse.json(payload);
  }),

  /** GET /content/articles/:slug */
  http.get(`${BASE}/articles/:slug`, ({ params }) => {
    const article = mockArticles.find((a) => a.slug === params['slug'] || a.id === params['slug']);

    if (!article) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: `Article '${params['slug']}' not found.` },
        { status: 404 },
      );
    }

    return HttpResponse.json({ data: article } satisfies ApiResponse<typeof article>);
  }),

  /** GET /content/promotions */
  http.get(`${BASE}/promotions`, ({ request }) => {
    const url = new URL(request.url);
    const providerId = url.searchParams.get('providerId');
    const activeOnly = url.searchParams.get('active') !== 'false';

    let promotions = mockPromotions;

    if (providerId) {
      promotions = promotions.filter((p) => p.providerId === providerId);
    }

    if (activeOnly) {
      const now = new Date().toISOString();
      promotions = promotions.filter((p) => p.validFrom <= now && p.validUntil >= now);
    }

    return HttpResponse.json({
      data: promotions,
      meta: { total: promotions.length, page: 1, perPage: 20, lastPage: 1, hasMore: false },
    } satisfies ApiResponse<typeof promotions>);
  }),
];
