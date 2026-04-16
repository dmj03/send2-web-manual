export const rateAlertQueryKeys = {
  all: ['rateAlerts'] as const,
  lists: () => [...rateAlertQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...rateAlertQueryKeys.all, 'detail', id] as const,
} as const;
