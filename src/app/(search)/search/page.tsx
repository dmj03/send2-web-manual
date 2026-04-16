import type { Metadata } from 'next';
import type { SearchFilters } from '@/types/search';
import { SearchResultsContainer } from '@/features/search/components';

interface SearchPageProps {
  searchParams: Promise<{
    fromCurrency?: string;
    toCurrency?: string;
    amount?: string;
    toCountry?: string;
    fromCountry?: string;
    method?: string;
    maxFee?: string;
    minRating?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const from = params.fromCurrency ?? 'GBP';
  const to = params.toCurrency ?? '';
  const amount = params.amount ? `${params.amount} ` : '';

  if (to) {
    return {
      title: `Send ${amount}${from} to ${to} — Compare Rates`,
      description: `Compare live exchange rates and transfer fees for sending ${amount}${from} to ${to}. Find the best deal from 50+ providers.`,
    };
  }

  return {
    title: 'Compare Money Transfer Rates',
    description:
      'Compare live exchange rates and fees from 50+ money transfer providers.',
  };
}

function parseFilters(params: Awaited<SearchPageProps['searchParams']>): SearchFilters | null {
  const sendCurrency = params.fromCurrency?.toUpperCase().trim();
  const receiveCurrency = params.toCurrency?.toUpperCase().trim();
  const receiveCountry = params.toCountry?.toUpperCase().trim();
  const rawAmount = params.amount ? Number(params.amount) : NaN;
  const sendAmount = isNaN(rawAmount) || rawAmount <= 0 ? 100 : rawAmount;

  if (!sendCurrency || !receiveCurrency || !receiveCountry) return null;

  const result: SearchFilters = {
    sendAmount,
    sendCurrency,
    receiveCurrency,
    receiveCountry,
  };
  if (params.method) result.transferMethod = params.method as import('@/types/provider').TransferMethod;
  if (params.maxFee) result.maxFee = Number(params.maxFee);
  if (params.minRating) result.minRating = Number(params.minRating);
  return result;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialFilters = parseFilters(params);

  const jsonLd = initialFilters
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Send ${initialFilters.sendCurrency} to ${initialFilters.receiveCurrency}`,
        description: `Compare money transfer providers for sending ${initialFilters.sendCurrency} to ${initialFilters.receiveCurrency}.`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        <SearchResultsContainer initialFilters={initialFilters} />
      </div>
    </>
  );
}
