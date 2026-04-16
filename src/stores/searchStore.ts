import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface SearchFilters {
  sendAmount: number;
  sendCurrency: string;
  receiveCurrency: string;
  receiveCountry: string;
  corridor: string;
}

export interface ProviderResult {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  exchangeRate: number;
  fee: number;
  receiveAmount: number;
  deliveryTime: string;
  rating: number | null;
  reviewCount: number;
  transferMethods: string[];
  isPromoted: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SearchState {
  filters: SearchFilters;
  results: ProviderResult[];
  pagination: Pagination;
  isSearching: boolean;
  lastQuery: string | null;
}

export interface SearchActions {
  setFilters: (filters: SearchFilters) => void;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  clearFilters: () => void;
  setResults: (results: ProviderResult[], pagination: Pagination) => void;
  appendResults: (results: ProviderResult[]) => void;
  setPage: (page: number) => void;
  setSearching: (isSearching: boolean) => void;
  resetSearch: () => void;
  setLastQuery: (query: string | null) => void;
}

type SearchStore = SearchState & SearchActions;

const defaultFilters: SearchFilters = {
  sendAmount: 0,
  sendCurrency: 'GBP',
  receiveCurrency: 'USD',
  receiveCountry: '',
  corridor: '',
};

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
};

const initialState: SearchState = {
  filters: defaultFilters,
  results: [],
  pagination: defaultPagination,
  isSearching: false,
  lastQuery: null,
};

export const useSearchStore = create<SearchStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setFilters: (filters) =>
        set((state) => {
          state.filters = filters;
        }, false, 'search/setFilters'),

      updateFilter: (key, value) =>
        set(
          (state) => {
            (state.filters as SearchFilters)[key] = value;
          },
          false,
          'search/updateFilter',
        ),

      clearFilters: () =>
        set(
          (state) => {
            state.filters = defaultFilters;
          },
          false,
          'search/clearFilters',
        ),

      setResults: (results, pagination) =>
        set(
          (state) => {
            state.results = results;
            state.pagination = pagination;
            state.isSearching = false;
          },
          false,
          'search/setResults',
        ),

      appendResults: (results) =>
        set(
          (state) => {
            state.results.push(...results);
          },
          false,
          'search/appendResults',
        ),

      setPage: (page) =>
        set(
          (state) => {
            state.pagination.page = page;
          },
          false,
          'search/setPage',
        ),

      setSearching: (isSearching) =>
        set((state) => {
          state.isSearching = isSearching;
        }, false, 'search/setSearching'),

      resetSearch: () =>
        set(
          (state) => {
            state.results = [];
            state.pagination = defaultPagination;
            state.isSearching = false;
            state.lastQuery = null;
          },
          false,
          'search/resetSearch',
        ),

      setLastQuery: (lastQuery) =>
        set((state) => {
          state.lastQuery = lastQuery;
        }, false, 'search/setLastQuery'),
    })),
    { name: 'SearchStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

// Typed selectors
export const selectFilters = (state: SearchStore) => state.filters;
export const selectResults = (state: SearchStore) => state.results;
export const selectPagination = (state: SearchStore) => state.pagination;
export const selectIsSearching = (state: SearchStore) => state.isSearching;
