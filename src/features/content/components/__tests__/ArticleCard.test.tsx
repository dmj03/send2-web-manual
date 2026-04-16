import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ArticleCard } from '../ArticleCard';
import type { Article } from '@/types/content';

// next/image and next/link are mocked globally via test-utils setup
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockArticle: Article = {
  id: 'art_01',
  slug: 'test-article',
  title: 'Test Article Title',
  excerpt: 'A short excerpt for the test article.',
  body: '<p>Full body content.</p>',
  featuredImageUrl: 'https://cdn.send2.io/test.jpg',
  category: 'guides',
  tags: ['test', 'guide'],
  author: {
    id: 'auth_01',
    name: 'Test Author',
    avatarUrl: null,
    bio: null,
  },
  publishedAt: '2025-03-15T09:00:00.000Z',
  updatedAt: '2025-03-15T09:00:00.000Z',
  isSponsored: false,
};

describe('ArticleCard', () => {
  it('renders the article title', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('renders the excerpt', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(
      screen.getByText('A short excerpt for the test article.'),
    ).toBeInTheDocument();
  });

  it('renders the author name', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(<ArticleCard article={mockArticle} />);
    expect(screen.getByText('Guide')).toBeInTheDocument();
  });

  it('links to the blog post URL by default', () => {
    render(<ArticleCard article={mockArticle} />);
    const links = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.includes('/blog/test-article'));
    expect(links.length).toBeGreaterThan(0);
  });

  it('links to the news URL when basePath is /news', () => {
    render(<ArticleCard article={mockArticle} basePath="/news" />);
    const links = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.includes('/news/test-article'));
    expect(links.length).toBeGreaterThan(0);
  });

  it('shows Sponsored badge when article is sponsored', () => {
    render(<ArticleCard article={{ ...mockArticle, isSponsored: true }} />);
    expect(screen.getByText('Sponsored')).toBeInTheDocument();
  });

  it('renders author initial when no avatar URL is provided', () => {
    render(<ArticleCard article={mockArticle} />);
    // Author initials: "T" from "Test Author"
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders the featured image when provided', () => {
    render(<ArticleCard article={mockArticle} />);
    const img = screen.getByRole('img', { name: 'Test Article Title' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.send2.io/test.jpg');
  });
});
