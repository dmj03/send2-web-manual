'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Route } from 'next';
import type { SearchFilters, SortField, SortDirection } from '@/types/search';

export interface ActiveFilters extends SearchFilters {
  sortField?: SortField;
  sortDirection?: SortDirection;
  page?: number;
}

function filtersFromParams(params: URLSearchParams): ActiveFilters | null {
  const fromCurrency = params.get('fromCurrency')?.toUpperCase();
  const toCurrency = params.get('toCurrency')?.toUpperCase();
  const receiveCountry = params.get('toCountry')?.toUpperCase();
  const rawAmount = Number(params.get('amount'));
  const sendAmount = isNaN(rawAmount) || rawAmount <= 0 ? 100 : rawAmount;

  if (!fromCurrency || !toCurrency || !receiveCountry) return null;

  const result: ActiveFilters = {
    sendCurrency: fromCurrency,
    receiveCurrency: toCurrency,
    receiveCountry,
    sendAmount,
    page: params.get('page') ? Number(params.get('page')) : 1,
  };
  const method = params.get('method');
  if (method) result.transferMethod = method as import('@/types/provider').TransferMethod;
  const maxFee = params.get('maxFee');
  if (maxFee) result.maxFee = Number(maxFee);
  const minRating = params.get('minRating');
  if (minRating) result.minRating = Number(minRating);
  const sort = params.get('sort');
  if (sort) result.sortField = sort as SortField;
  const dir = params.get('dir');
  if (dir) result.sortDirection = dir as SortDirection;
  return result;
}

function filtersToParams(filters: ActiveFilters): URLSearchParams {
  const p = new URLSearchParams();
  p.set('fromCurrency', filters.sendCurrency);
  p.set('toCurrency', filters.receiveCurrency);
  p.set('toCountry', filters.receiveCountry);
  p.set('amount', String(filters.sendAmount));
  if (filters.transferMethod) p.set('method', filters.transferMethod);
  if (filters.maxFee !== undefined) p.set('maxFee', String(filters.maxFee));
  if (filters.minRating !== undefined) p.set('minRating', String(filters.minRating));
  if (filters.sortField) p.set('sort', filters.sortField);
  if (filters.sortDirection) p.set('dir', filters.sortDirection);
  if (filters.page && filters.page > 1) p.set('page', String(filters.page));
  return p;
}

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilters = filtersFromParams(searchParams);

  const updateFilters = useCallback(
    (patch: Partial<ActiveFilters>) => {
      if (!activeFilters) return;
      const merged: ActiveFilters = { ...activeFilters, ...patch, page: 1 };
      const qs = filtersToParams(merged).toString();
      router.push(`${pathname}?${qs}` as Route, { scroll: false });
    },
    [router, pathname, activeFilters],
  );

  const setSort = useCallback(
    (field: SortField, direction: SortDirection = 'asc') => {
      updateFilters({ sortField: field, sortDirection: direction });
    },
    [updateFilters],
  );

  const resetFilters = useCallback(() => {
    if (!activeFilters) return;
    const base: ActiveFilters = {
      sendAmount: activeFilters.sendAmount,
      sendCurrency: activeFilters.sendCurrency,
      receiveCurrency: activeFilters.receiveCurrency,
      receiveCountry: activeFilters.receiveCountry,
    };
    const qs = filtersToParams(base).toString();
    router.push(`${pathname}?${qs}` as Route, { scroll: false });
  }, [router, pathname, activeFilters]);

  return { activeFilters, updateFilters, setSort, resetFilters };
}
