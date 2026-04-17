import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/auth';
import { mockUser } from '../fixtures/users';

const BASE = '/profile';

let profileStore: User = { ...mockUser };

export const profileHandlers = [
  /** GET /profile */
  http.get(BASE, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 },
      );
    }

    return HttpResponse.json({ data: profileStore } satisfies ApiResponse<User>);
  }),

  /** PATCH /profile */
  http.patch(BASE, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const body = await request.json() as Partial<Pick<User, 'name' | 'avatarUrl'>>;

    profileStore = {
      ...profileStore,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ data: profileStore } satisfies ApiResponse<User>);
  }),
];
