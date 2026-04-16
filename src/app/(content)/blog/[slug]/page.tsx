import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleDetailClient } from '@/features/content/components/ArticleDetailClient';
import type { Article } from '@/types/content';

export const revalidate = 120;

// ---------------------------------------------------------------------------
// Data fetching helpers
// ---------------------------------------------------------------------------

const BASE_URL =
  process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';

async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/content/articles/${encodeURIComponent(slug)}`,
      { next: { revalidate: 120 } },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Article };
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function fetchAllSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/content/articles?page=1&perPage=100`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Article[] };
    return (json.data ?? []).map((a) => a.slug);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await fetchAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    authors: [{ name: article.author.name }],
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url: `/blog/${article.slug}`,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      ...(article.featuredImageUrl
        ? {
            images: [
              {
                url: article.featuredImageUrl,
                width: 1200,
                height: 675,
                alt: article.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      ...(article.featuredImageUrl
        ? { images: [article.featuredImageUrl] }
        : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);

  if (!article) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      ...(article.author.avatarUrl
        ? { image: article.author.avatarUrl }
        : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Send2',
      logo: {
        '@type': 'ImageObject',
        url: 'https://send2.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://send2.com/blog/${article.slug}`,
    },
    ...(article.featuredImageUrl
      ? { image: article.featuredImageUrl }
      : {}),
    keywords: article.tags.join(', '),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetailClient article={article} isNews={false} />
    </>
  );
}
