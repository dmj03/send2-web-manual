import type { SearchFilters, SearchResults, SearchSuggestion } from '@/types/search';
import type { Corridor } from '@/types/provider';
import { mockProviderResults } from './providers';

const mockCorridor: Corridor = {
  sendCurrency: 'GBP',
  receiveCountry: 'US',
  receiveCurrency: 'USD',
};

export const mockSearchFilters: SearchFilters = {
  sendAmount: 500,
  sendCurrency: 'GBP',
  receiveCountry: 'US',
  receiveCurrency: 'USD',
};

export const mockSearchResults: SearchResults = {
  results: mockProviderResults,
  meta: {
    total: 5,
    page: 1,
    perPage: 10,
    lastPage: 1,
    hasMore: false,
  },
  corridor: mockCorridor,
  lastUpdated: '2025-04-14T10:00:00.000Z',
};

export const mockSearchSuggestions: SearchSuggestion[] = [
  { label: 'United States (USD)', value: 'US', flag: 'us' },
  { label: 'Nigeria (NGN)', value: 'NG', flag: 'ng' },
  { label: 'Ghana (GHS)', value: 'GH', flag: 'gh' },
  { label: 'Kenya (KES)', value: 'KE', flag: 'ke' },
  { label: 'India (INR)', value: 'IN', flag: 'in' },
  { label: 'Philippines (PHP)', value: 'PH', flag: 'ph' },
  { label: 'Mexico (MXN)', value: 'MX', flag: 'mx' },
];
