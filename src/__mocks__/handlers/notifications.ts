import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/types/api';
import type { AppNotification } from '@/types/notification';
import { mockNotifications } from '../fixtures/notifications';

const BASE = '/notifications';

let notificationStore: AppNotification[] = [...mockNotifications];

export const notificationHandlers = [
  /** GET /notifications */
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const data = unreadOnly ? notificationStore.filter((n) => !n.isRead) : notificationStore;

    const payload: ApiResponse<AppNotification[]> = {
      data,
      meta: {
        total: data.length,
        page: 1,
        perPage: 20,
        lastPage: 1,
        hasMore: false,
      },
    };

    return HttpResponse.json(payload);
  }),

  /** PATCH /notifications/:id/read */
  http.patch(`${BASE}/:id/read`, ({ params }) => {
    const idx = notificationStore.findIndex((n) => n.id === params['id']);

    if (idx === -1) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: 'Notification not found.' },
        { status: 404 },
      );
    }

    const updated: AppNotification = { ...notificationStore[idx]!, isRead: true };
    notificationStore = notificationStore.map((n) =>
      n.id === params['id'] ? updated : n,
    );

    return HttpResponse.json({ data: updated } satisfies ApiResponse<AppNotification>);
  }),

  /** PATCH /notifications/read-all */
  http.patch(`${BASE}/read-all`, () => {
    notificationStore = notificationStore.map((n) => ({ ...n, isRead: true }));
    return HttpResponse.json({ data: null, message: 'All notifications marked as read.' });
  }),
];
