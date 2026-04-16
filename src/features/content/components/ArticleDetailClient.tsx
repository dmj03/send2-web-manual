'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import type { Article } from '@/types/content';
import { ROUTES } from '@/lib/navigation';

const CATEGORY_LABELS: Record<Article['category'], string> = {
  news: 'News',
  guides: 'Guide',
  reviews: 'Review',
  promotions: 'Promotion',
  'currency-news': 'Currency News',
  tips: 'Tips',
};

const CATEGORY_COLOURS: Record<Article['category'], string> = {
  news: 'bg-sky-50 text-sky-700',
  guides: 'bg-emerald-50 text-emerald-700',
  reviews: 'bg-violet-50 text-violet-700',
  promotions: 'bg-orange-50 text-orange-700',
  'currency-news': 'bg-blue-50 text-blue-700',
  tips: 'bg-yellow-50 text-yellow-700',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface ArticleDetailClientProps {
  article: Article;
  /** Whether the article came from the /news path. Affects "Back" link. */
  isNews?: boolean;
}

export function ArticleDetailClient({
  article,
  isNews = false,
}: ArticleDetailClientProps) {
  const backHref = (isNews ? ROUTES.news.index : ROUTES.blog.index) as Route;
  const backLabel = isNews ? 'Back to News' : 'Back to Blog';
  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;
  const categoryColour =
    CATEGORY_COLOURS[article.category] ?? 'bg-gray-100 text-gray-600';

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            /
          </li>
          <li>
            <Link
              href={backHref}
              className="hover:text-blue-600 transition-colors"
            >
              {isNews ? 'News' : 'Blog'}
            </Link>
          </li>
          <li aria-hidden="true" className="select-none">
            /
          </li>
          <li className="max-w-[200px] truncate font-medium text-gray-900" aria-current="page">
            {article.title}
          </li>
        </ol>
      </nav>

      {/* Back link */}
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {backLabel}
      </Link>

      {/* Category badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${categoryColour}`}
        >
          {categoryLabel}
        </span>
        {article.isSponsored && (
          <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Sponsored
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
        {article.title}
      </h1>

      {/* Excerpt */}
      <p className="mb-6 text-lg leading-relaxed text-gray-500">
        {article.excerpt}
      </p>

      {/* Author / meta row */}
      <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-t border-gray-100 py-4">
        <div className="flex items-center gap-3">
          {article.author.avatarUrl ? (
            <Image
              src={article.author.avatarUrl}
              alt={article.author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {article.author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {article.author.name}
            </p>
            <time
              dateTime={article.publishedAt}
              className="text-xs text-gray-400"
            >
              {formatDate(article.publishedAt)}
            </time>
          </div>
        </div>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Featured image */}
      {article.featuredImageUrl && (
        <div className="mb-8 overflow-hidden rounded-2xl">
          <Image
            src={article.featuredImageUrl}
            alt={article.title}
            width={768}
            height={432}
            className="w-full object-cover"
            priority
          />
        </div>
      )}

      {/* Article body */}
      <div
        className="prose prose-gray max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />

      {/* Updated notice */}
      {article.updatedAt !== article.publishedAt && (
        <p className="mt-10 text-xs text-gray-400">
          Last updated:{' '}
          <time dateTime={article.updatedAt}>
            {formatDate(article.updatedAt)}
          </time>
        </p>
      )}
    </article>
  );
}
