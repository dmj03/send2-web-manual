import type { User } from '@/types/auth';

export const mockUser: User = {
  id: 'usr_01HXYZ123456ABCDEF',
  email: 'james.okafor@example.com',
  name: 'James Okafor',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
  roles: ['user'],
  isVerified: true,
  createdAt: '2024-03-15T10:22:00.000Z',
  updatedAt: '2025-01-08T14:35:00.000Z',
};

export const mockAdmin: User = {
  id: 'usr_01HXYZ789012GHIJKL',
  email: 'admin@send2.io',
  name: 'Send2 Admin',
  avatarUrl: null,
  roles: ['admin', 'user'],
  isVerified: true,
  createdAt: '2023-01-01T09:00:00.000Z',
  updatedAt: '2025-04-01T08:00:00.000Z',
};

export const mockUnverifiedUser: User = {
  id: 'usr_01HXYZ345678MNOPQR',
  email: 'fatima.hassan@example.com',
  name: 'Fatima Hassan',
  avatarUrl: null,
  roles: ['user'],
  isVerified: false,
  createdAt: '2025-04-10T16:45:00.000Z',
  updatedAt: '2025-04-10T16:45:00.000Z',
};

export const mockProviderRep: User = {
  id: 'usr_01HXYZ901234STUVWX',
  email: 'rep@wise.com',
  name: 'Wise Representative',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wise',
  roles: ['provider_rep', 'user'],
  isVerified: true,
  createdAt: '2024-06-20T11:00:00.000Z',
  updatedAt: '2025-02-14T09:20:00.000Z',
};

export const mockUsers: User[] = [
  mockUser,
  mockAdmin,
  mockUnverifiedUser,
  mockProviderRep,
];
