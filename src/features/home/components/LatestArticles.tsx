import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/navigation';
import type { Article } from '@/types/content';
import type { Route } from 'next';

async function getLatestArticles(): Promise<Article[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/content/articles?limit=3`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Article[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function LatestArticles() {
  const articles = await getLatestArticles();

  if (articles.length === 0) return null;

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={ROUTES.blog.post(article.slug) as Route}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Read: ${article.title}`}
            >
              {/* Featured image */}
              <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                {article.featuredImageUrl ? (
                  <Image
                    src={article.featuredImageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ArticlePlaceholder category={article.category} />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium capitalize text-white">
                  {article.category.replace(/-/g, ' ')}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900 group-hover:text-blue-700">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-500">
                  {article.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  {article.author.avatarUrl && (
                    <div className="relative h-5 w-5 overflow-hidden rounded-full">
                      <Image
                        src={article.author.avatarUrl}
                        alt={article.author.name}
                        fill
                        sizes="20px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span>{article.author.name}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                  </time>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 text-center">
        <Link
          href={ROUTES.blog.index as Route}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
        >
          View all articles
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </>
  );
}

function ArticlePlaceholder({ category }: { category: string }) {
  const colors: Record<string, string> = {
    news: 'from-blue-100 to-blue-50',
    guides: 'from-green-100 to-green-50',
    reviews: 'from-purple-100 to-purple-50',
    promotions: 'from-yellow-100 to-yellow-50',
    'currency-news': 'from-orange-100 to-orange-50',
    tips: 'from-teal-100 to-teal-50',
  };

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${colors[category] ?? 'from-gray-100 to-gray-50'}`}
      aria-hidden="true"
    >
      <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}
