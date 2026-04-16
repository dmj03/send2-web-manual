import { http, HttpResponse, delay } from 'msw';
import type { ApiResponse } from '@/types/api';
import { mockSearchResults, mockSearchSuggestions } from '../fixtures/search';

export const searchHandlers = [
  /** GET /search — 400 ms simulated latency */
  http.get('https://api.send2app.com/search', async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const sendAmount = Number(url.searchParams.get('sendAmount') ?? 500);

    // Scale receive amounts proportionally if a different send amount is requested
    const scaleFactor = sendAmount / 500;
    const scaledResults = {
      ...mockSearchResults,
      sendAmount,
      results: mockSearchResults.results.map((r) => ({
        ...r,
        sendAmount,
        recipientAmount: Math.round(r.recipientAmount * scaleFactor * 100) / 100,
        totalCost: Math.round((r.totalCost - 500 + sendAmount) * 100) / 100,
      })),
    };

    const payload: ApiResponse<typeof scaledResults> = { data: scaledResults };

    return HttpResponse.json(payload);
  }),

  /** GET /search/suggest — autocomplete for destination country/currency */
  http.get('https://api.send2app.com/search/suggest', ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();

    const filtered = q.length >= 2
      ? mockSearchSuggestions.filter(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            s.value.toLowerCase().includes(q),
        )
      : mockSearchSuggestions.slice(0, 5);

    return HttpResponse.json({ data: filtered } satisfies ApiResponse<typeof filtered>);
  }),

  /** GET /rates/live — live mid-market rates */
  http.get('https://api.send2app.com/rates/live', ({ request }) => {
    const url = new URL(request.url);
    const base = url.searchParams.get('base') ?? 'GBP';

    const rates: Record<string, number> = {
      NGN: 1668.78,
      USD: 1.27,
      EUR: 1.17,
      GHS: 15.9,
      KES: 163.4,
      INR: 105.2,
      PHP: 71.6,
      MXN: 21.3,
    };

    return HttpResponse.json({
      data: { base, rates, fetchedAt: new Date().toISOString() },
    });
  }),
];
