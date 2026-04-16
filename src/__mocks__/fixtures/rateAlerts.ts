import type { RateAlert } from '@/types/rate-alert';

export const mockRateAlert: RateAlert = {
  id: 'alert_01',
  userId: 'usr_01HXYZ123456ABCDEF',
  fromCurrency: 'GBP',
  toCurrency: 'NGN',
  targetRate: 1700.0,
  currentRate: 1668.78,
  isActive: true,
  notifyVia: ['email', 'push'],
  createdAt: '2025-03-01T12:00:00.000Z',
  triggeredAt: null,
};

export const mockRateAlerts: RateAlert[] = [
  mockRateAlert,
  {
    id: 'alert_02',
    userId: 'usr_01HXYZ123456ABCDEF',
    fromCurrency: 'GBP',
    toCurrency: 'USD',
    targetRate: 1.32,
    currentRate: 1.27,
    isActive: true,
    notifyVia: ['email'],
    createdAt: '2025-02-14T09:00:00.000Z',
    triggeredAt: null,
  },
  {
    id: 'alert_03',
    userId: 'usr_01HXYZ123456ABCDEF',
    fromCurrency: 'GBP',
    toCurrency: 'GHS',
    targetRate: 16.5,
    currentRate: 15.9,
    isActive: false,
    notifyVia: ['push'],
    createdAt: '2025-01-05T11:00:00.000Z',
    triggeredAt: '2025-03-30T16:00:00.000Z',
  },
];
