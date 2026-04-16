import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticleGridClient } from '@/features/content/components/ArticleGridClient';
import { ArticleGridSkeleton } from '@/features/content/components/ContentSkeletons';
import type { Article } from '@/types/content';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Money Transfer News | Send2',
  description:
    'Latest news on exchange rates, currency markets, remittance trends, and international money transfer updates.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'Money Transfer News — Send2',
    description:
      'Stay up to date with exchange rate news and international money transfer industry updates.',
    url: '/news',
  },
};

async function fetchNewsArticles(): Promise<Article[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(
      `${baseUrl}/content/articles?page=1&perPage=12&category=news`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Article[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const articles = await fetchNewsArticles();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Money Transfer News — Send2',
    description:
      'Latest exchange rate news and remittance industry updates from Send2.',
    url: 'https://send2.com/news',
    hasPart: articles.slice(0, 10).map((a) => ({
      '@type': 'NewsArticle',
      headline: a.title,
      description: a.excerpt,
      datePublished: a.publishedAt,
      author: { '@type': 'Person', name: a.author.name },
      url: `https://send2.com/news/${a.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Money Transfer News
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-500">
            Stay up to date with exchange rate movements, provider announcements,
            and remittance industry news.
          </p>
        </header>

        <Suspense fallback={<ArticleGridSkeleton count={9} />}>
          <ArticleGridClient
            initialArticles={articles}
            variant="news"
            lockedCategory="news"
          />
        </Suspense>
      </div>
    </>
  );
}
