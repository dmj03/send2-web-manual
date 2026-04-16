'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';
import type { ProviderResult } from '@/types/provider';

interface CompareTableProps {
  providers: ProviderResult[];
  sendCurrency: string;
  receiveCurrency: string;
}

interface RowDef {
  label: string;
  render: (p: ProviderResult) => React.ReactNode;
}

function buildRows(sendCurrency: string, receiveCurrency: string): RowDef[] {
  return [
    {
      label: 'Recipient receives',
      render: (p) => (
        <span className="text-lg font-bold text-gray-900">
          {receiveCurrency}{' '}
          {new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(p.recipientAmount)}
        </span>
      ),
    },
    {
      label: 'Exchange rate',
      render: (p) => (
        <span className="font-semibold text-gray-800">
          1 {sendCurrency} ={' '}
          {new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 6,
          }).format(p.exchangeRate)}{' '}
          {receiveCurrency}
        </span>
      ),
    },
    {
      label: 'Total cost',
      render: (p) => (
        <span>
          {sendCurrency}{' '}
          {new Intl.NumberFormat('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(p.totalCost)}
        </span>
      ),
    },
    {
      label: 'Transfer speed',
      render: (p) => <span>{p.transferSpeed}</span>,
    },
    {
      label: 'Transfer method',
      render: (p) => (
        <span className="capitalize">
          {p.transferMethod.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      label: 'Rating',
      render: (p) =>
        p.rating > 0 ? (
          <span className="flex items-center justify-center gap-1">
            <svg
              className="h-4 w-4 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            {p.rating.toFixed(1)}
            <span className="text-xs text-gray-400">
              ({p.reviewCount.toLocaleString()})
            </span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">No reviews</span>
        ),
    },
    {
      label: 'Promo',
      render: (p) =>
        p.promoLabel ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {p.promoLabel}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        ),
    },
  ];
}

export function CompareTable({ providers, sendCurrency, receiveCurrency }: CompareTableProps) {
  const rows = buildRows(sendCurrency, receiveCurrency);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th
              scope="col"
              className="w-32 bg-gray-50 p-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Provider
            </th>
            {providers.map((p) => (
              <th key={p.id} scope="col" className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    {p.logoUrl ? (
                      <Image
                        src={p.logoUrl}
                        alt={`${p.name} logo`}
                        fill
                        sizes="40px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={ROUTES.providers.detail(p.slug) as Route}
                    className="font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    {p.name}
                  </Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
            >
              <th
                scope="row"
                className="p-4 text-left text-xs font-medium text-gray-500"
              >
                {row.label}
              </th>
              {providers.map((p) => (
                <td key={p.id} className="p-4 text-center">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}

          {/* CTA row */}
          <tr>
            <td className="bg-gray-50 p-4" />
            {providers.map((p) => (
              <td key={p.id} className="p-4 text-center">
                <Link
                  href={ROUTES.providers.detail(p.slug) as Route}
                  className="inline-block rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Send with {p.name}
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
