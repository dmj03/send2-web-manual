import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticleGridClient } from '@/features/content/components/ArticleGridClient';
import { ArticleGridSkeleton } from '@/features/content/components/ContentSkeletons';
import type { Article } from '@/types/content';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Blog — Guides, Reviews & Tips | Send2',
  description:
    'Money transfer guides, provider reviews, currency tips, and promotions. Stay informed before you send.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — Send2',
    description:
      'Guides, reviews, and tips to help you make smarter international money transfers.',
    url: '/blog',
  },
};

async function fetchArticles(): Promise<Article[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(
      `${baseUrl}/content/articles?page=1&perPage=12`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Article[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const articles = await fetchArticles();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Send2 Blog',
    description:
      'Money transfer guides, reviews, tips and news from Send2.',
    url: 'https://send2.com/blog',
    blogPost: articles.slice(0, 10).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.excerpt,
      datePublished: a.publishedAt,
      dateModified: a.updatedAt,
      author: { '@type': 'Person', name: a.author.name },
      url: `https://send2.com/blog/${a.slug}`,
      ...(a.featuredImageUrl
        ? { image: a.featuredImageUrl }
        : {}),
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
            Send2 Blog
          </h1>
          <p className="mt-2 max-w-2xl text-base text-gray-500">
            Guides, reviews, and tips to help you make smarter international
            money transfers.
          </p>
        </header>

        <Suspense fallback={<ArticleGridSkeleton count={9} />}>
          <ArticleGridClient initialArticles={articles} variant="blog" />
        </Suspense>
      </div>
    </>
  );
}
