import { http, HttpResponse, delay } from 'msw';
import type { ApiResponse } from '@/types/api';
import type { Corridor } from '@/types/provider';
import {
  mockProviders,
  mockProviderWise,
  mockProviderResults,
  mockReviews,
} from '../fixtures/providers';

const BASE = '/providers';

export const providerHandlers = [
  /** GET /providers — full provider list */
  http.get(BASE, () => {
    const payload: ApiResponse<typeof mockProviders> = {
      data: mockProviders,
      meta: {
        total: mockProviders.length,
        page: 1,
        perPage: 20,
        lastPage: 1,
        hasMore: false,
      },
    };
    return HttpResponse.json(payload);
  }),

  /** GET /providers/search — search with 200 ms simulated latency */
  http.get(`${BASE}/search`, async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const sendCurrency = url.searchParams.get('sendCurrency');
    const receiveCountry = url.searchParams.get('receiveCountry');
    const page = Number(url.searchParams.get('page') ?? 1);
    const perPage = Number(url.searchParams.get('perPage') ?? 10);

    // Filter results by corridor if params provided
    let results = mockProviderResults;
    if (sendCurrency && receiveCountry) {
      results = mockProviderResults.filter((r) =>
        r.supportedCorridors.some(
          (c: Corridor) => c.sendCurrency === sendCurrency && c.receiveCountry === receiveCountry,
        ),
      );
    }

    const payload: ApiResponse<typeof results> = {
      data: results,
      meta: {
        total: results.length,
        page,
        perPage,
        lastPage: Math.ceil(results.length / perPage),
        hasMore: page * perPage < results.length,
      },
    };

    return HttpResponse.json(payload);
  }),

  /** GET /providers/compare — returns subset based on ?ids= query param */
  http.get(`${BASE}/compare`, ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll('ids');

    const filtered = ids.length
      ? mockProviders.filter((p) => ids.includes(p.id))
      : mockProviders.slice(0, 3);

    return HttpResponse.json({ data: filtered } satisfies ApiResponse<typeof filtered>);
  }),

  /** GET /providers/:id/reviews — paginated */
  http.get(`${BASE}/:id/reviews`, async ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const perPage = Number(url.searchParams.get('perPage') ?? 10);

    const reviews = mockReviews.filter((r) => r.providerId === params['id']);

    const payload: ApiResponse<typeof reviews> = {
      data: reviews,
      meta: {
        total: reviews.length,
        page,
        perPage,
        lastPage: Math.max(1, Math.ceil(reviews.length / perPage)),
        hasMore: page * perPage < reviews.length,
      },
    };

    return HttpResponse.json(payload);
  }),

  /** GET /providers/:id — single provider; must come after /search and /compare */
  http.get(`${BASE}/:id`, ({ params }) => {
    const provider = mockProviders.find((p) => p.id === params['id'] || p.slug === params['id']);

    if (!provider) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: `Provider '${params['id']}' not found.` },
        { status: 404 },
      );
    }

    return HttpResponse.json({ data: provider } satisfies ApiResponse<typeof provider>);
  }),
];
