import { describe, it, expect, beforeEach } from 'vitest';
import {
  useSearchStore,
  selectFilters,
  selectPagination,
  selectResults,
  type SearchFilters,
  type ProviderResult,
  type Pagination,
} from '@/stores/searchStore';

const defaultFilters: SearchFilters = {
  sendAmount: 0,
  sendCurrency: 'GBP',
  receiveCurrency: 'USD',
  receiveCountry: '',
  corridor: '',
};

const customFilters: SearchFilters = {
  sendAmount: 500,
  sendCurrency: 'GBP',
  receiveCurrency: 'NGN',
  receiveCountry: 'NG',
  corridor: 'GBP-NGN',
};

const mockPagination: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
};

beforeEach(() => {
  useSearchStore.setState({
    filters: defaultFilters,
    results: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    isSearching: false,
    lastQuery: null,
  });
});

describe('searchStore — setFilters', () => {
  it('replaces the entire filters object', () => {
    useSearchStore.getState().setFilters(customFilters);
    expect(selectFilters(useSearchStore.getState())).toEqual(customFilters);
  });

  it('sets sendAmount correctly', () => {
    useSearchStore.getState().setFilters({ ...defaultFilters, sendAmount: 250 });
    expect(useSearchStore.getState().filters.sendAmount).toBe(250);
  });
});

describe('searchStore — updateFilter', () => {
  it('updates a single filter key without touching others', () => {
    useSearchStore.getState().setFilters(customFilters);
    useSearchStore.getState().updateFilter('sendAmount', 1000);

    const filters = selectFilters(useSearchStore.getState());
    expect(filters.sendAmount).toBe(1000);
    expect(filters.sendCurrency).toBe('GBP');
    expect(filters.receiveCountry).toBe('NG');
  });
});

describe('searchStore — clearFilters', () => {
  it('resets filters back to defaults', () => {
    useSearchStore.getState().setFilters(customFilters);
    useSearchStore.getState().clearFilters();

    expect(selectFilters(useSearchStore.getState())).toEqual(defaultFilters);
  });

  it('does not clear results when called', () => {
    const mockResults: ProviderResult[] = [
      {
        id: 'p1',
        name: 'Wise',
        slug: 'wise',
        logoUrl: null,
        exchangeRate: 1.27,
        fee: 1.5,
        receiveAmount: 635,
        deliveryTime: 'Instant',
        rating: 4.8,
        reviewCount: 100,
        transferMethods: ['bank'],
        isPromoted: false,
      },
    ];
    const mockPag: Pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    useSearchStore.getState().setResults(mockResults, mockPag);
    useSearchStore.getState().clearFilters();

    expect(selectResults(useSearchStore.getState())).toHaveLength(1);
  });
});

describe('searchStore — setPage', () => {
  it('updates the pagination page', () => {
    useSearchStore.getState().setPage(3);
    expect(selectPagination(useSearchStore.getState()).page).toBe(3);
  });

  it('does not affect other pagination fields', () => {
    useSearchStore.setState({
      pagination: { page: 1, pageSize: 20, total: 100, totalPages: 5 },
    });
    useSearchStore.getState().setPage(2);

    const pag = selectPagination(useSearchStore.getState());
    expect(pag.page).toBe(2);
    expect(pag.total).toBe(100);
    expect(pag.pageSize).toBe(20);
  });
});

describe('searchStore — setResults', () => {
  it('sets results and marks isSearching false', () => {
    useSearchStore.getState().setSearching(true);
    useSearchStore.getState().setResults([], mockPagination);

    expect(useSearchStore.getState().isSearching).toBe(false);
    expect(selectResults(useSearchStore.getState())).toEqual([]);
  });
});

describe('searchStore — resetSearch', () => {
  it('clears results, pagination, and lastQuery', () => {
    useSearchStore.getState().setLastQuery('GBP-NGN-500');
    useSearchStore.getState().setPage(3);
    useSearchStore.getState().resetSearch();

    const state = useSearchStore.getState();
    expect(state.results).toEqual([]);
    expect(state.pagination.page).toBe(1);
    expect(state.lastQuery).toBeNull();
    expect(state.isSearching).toBe(false);
  });
});
