'use client';

import { useState, useMemo } from 'react';
import type { Provider, TransferMethod } from '@/types/provider';

export type SortKey = 'rating' | 'name' | 'reviews';
export type SortDir = 'asc' | 'desc';

export interface ProviderFilters {
  query: string;
  transferMethod: TransferMethod | '';
  verifiedOnly: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
}

const DEFAULT_FILTERS: ProviderFilters = {
  query: '',
  transferMethod: '',
  verifiedOnly: false,
  sortKey: 'rating',
  sortDir: 'desc',
};

export function useProviderFilters(allProviders: Provider[]) {
  const [filters, setFilters] = useState<ProviderFilters>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    let result = allProviders;

    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (filters.transferMethod) {
      result = result.filter((p) =>
        p.transferMethods.includes(filters.transferMethod as TransferMethod),
      );
    }

    if (filters.verifiedOnly) {
      result = result.filter((p) => p.isVerified);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (filters.sortKey === 'rating') cmp = a.rating - b.rating;
      else if (filters.sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (filters.sortKey === 'reviews') cmp = a.reviewCount - b.reviewCount;

      return filters.sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [allProviders, filters]);

  function setQuery(query: string) {
    setFilters((f) => ({ ...f, query }));
  }

  function setTransferMethod(method: TransferMethod | '') {
    setFilters((f) => ({ ...f, transferMethod: method }));
  }

  function setVerifiedOnly(value: boolean) {
    setFilters((f) => ({ ...f, verifiedOnly: value }));
  }

  function setSort(key: SortKey, dir?: SortDir) {
    setFilters((f) => ({
      ...f,
      sortKey: key,
      sortDir: dir ?? (f.sortKey === key && f.sortDir === 'desc' ? 'asc' : 'desc'),
    }));
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
  }

  return { filters, filtered, setQuery, setTransferMethod, setVerifiedOnly, setSort, reset };
}
