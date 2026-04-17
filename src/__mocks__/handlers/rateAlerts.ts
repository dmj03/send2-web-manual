import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/types/api';
import type { RateAlert } from '@/types/rate-alert';
import { mockRateAlerts, mockRateAlert } from '../fixtures/rateAlerts';

const BASE = '/rate-alerts';

// In-memory store for the handler session
let alertStore: RateAlert[] = [...mockRateAlerts];

export const rateAlertHandlers = [
  /** GET /rate-alerts */
  http.get(BASE, () => {
    const payload: ApiResponse<RateAlert[]> = {
      data: alertStore,
      meta: {
        total: alertStore.length,
        page: 1,
        perPage: 20,
        lastPage: 1,
        hasMore: false,
      },
    };
    return HttpResponse.json(payload);
  }),

  /** POST /rate-alerts */
  http.post(BASE, async ({ request }) => {
    const body = await request.json() as Partial<RateAlert>;

    const newAlert: RateAlert = {
      ...mockRateAlert,
      ...body,
      id: `alert_${Date.now()}`,
      createdAt: new Date().toISOString(),
      triggeredAt: null,
    };

    alertStore = [...alertStore, newAlert];

    return HttpResponse.json({ data: newAlert } satisfies ApiResponse<RateAlert>, { status: 201 });
  }),

  /** PATCH /rate-alerts/:id */
  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<RateAlert>;
    const idx = alertStore.findIndex((a) => a.id === params['id']);

    if (idx === -1) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Rate alert not found.' },
        { status: 404 },
      );
    }

    const updated: RateAlert = { ...alertStore[idx]!, ...body };
    alertStore = alertStore.map((a) => (a.id === params['id'] ? updated : a));

    return HttpResponse.json({ data: updated } satisfies ApiResponse<RateAlert>);
  }),

  /** DELETE /rate-alerts/:id */
  http.delete(`${BASE}/:id`, ({ params }) => {
    const exists = alertStore.some((a) => a.id === params['id']);

    if (!exists) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Rate alert not found.' },
        { status: 404 },
      );
    }

    alertStore = alertStore.filter((a) => a.id !== params['id']);

    return new HttpResponse(null, { status: 204 });
  }),
];
