import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import type { Article } from '@/types/content';
import { ROUTES } from '@/lib/navigation';

/** Maps category slug to a human-readable label. */
const CATEGORY_LABELS: Record<Article['category'], string> = {
  news: 'News',
  guides: 'Guide',
  reviews: 'Review',
  promotions: 'Promotion',
  'currency-news': 'Currency News',
  tips: 'Tips',
};

/** Maps category slug to Tailwind colour classes (badge). */
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
    month: 'short',
    year: 'numeric',
  });
}

interface ArticleCardProps {
  article: Article;
  /** The route prefix — '/blog' or '/news'. Defaults to the ROUTES logic based on category. */
  basePath?: string;
}

export function ArticleCard({ article, basePath }: ArticleCardProps) {
  const href = (
    basePath === '/news'
      ? ROUTES.news.post(article.slug)
      : ROUTES.blog.post(article.slug)
  ) as Route;

  const categoryLabel = CATEGORY_LABELS[article.category] ?? article.category;
  const categoryColour =
    CATEGORY_COLOURS[article.category] ?? 'bg-gray-100 text-gray-600';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-[16/9] overflow-hidden bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        tabIndex={-1}
        aria-hidden="true"
      >
        {article.featuredImageUrl ? (
          <Image
            src={article.featuredImageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <svg
              className="h-12 w-12 text-blue-200"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
              />
            </svg>
          </div>
        )}

        {article.isSponsored && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            Sponsored
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {/* Category badge */}
        <span
          className={`mb-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColour}`}
        >
          {categoryLabel}
        </span>

        {/* Title */}
        <h2 className="mb-2 text-base font-semibold leading-snug text-gray-900">
          <Link
            href={href}
            className="transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            {article.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-500">
          {article.excerpt}
        </p>

        {/* Author / date */}
        <div className="mt-auto flex items-center gap-3 border-t border-gray-100 pt-4 mt-4">
          {article.author.avatarUrl ? (
            <Image
              src={article.author.avatarUrl}
              alt={article.author.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
              {article.author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-700">
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
      </div>
    </article>
  );
}
