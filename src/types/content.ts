/**
 * CMS content domain types.
 * Covers blog articles, authors, categories, and promotional banners sourced
 * from Strapi (or any headless CMS replacement).
 */

/** All available article category slugs. */
export type ArticleCategory =
  | 'news'
  | 'guides'
  | 'reviews'
  | 'promotions'
  | 'currency-news'
  | 'tips';

/** An article author record. */
export interface Author {
  id: string;
  name: string;
  /** Absolute URL of the author's avatar. */
  avatarUrl: string | null;
  bio: string | null;
}

/** A full blog/news article record. */
export interface Article {
  id: string;
  /** URL-safe slug used in the route (e.g. /blog/[slug]). */
  slug: string;
  title: string;
  excerpt: string;
  /** Full HTML or Markdown body. */
  body: string;
  author: Author;
  category: ArticleCategory;
  tags: string[];
  /** Absolute URL of the featured image. */
  featuredImageUrl: string | null;
  /** ISO 8601 publish timestamp. */
  publishedAt: string;
  /** ISO 8601 last-updated timestamp. */
  updatedAt: string;
  isSponsored: boolean;
}

/** Discount type for a provider promotion. */
export type DiscountType = 'percentage' | 'fixed' | 'fee_waived' | 'rate_boost';

/** A provider-linked promotional offer. */
export interface Promotion {
  id: string;
  providerId: string;
  title: string;
  description: string;
  promoCode: string | null;
  discountType: DiscountType;
  /** Discount magnitude — percentage points for "percentage", send-currency amount for "fixed". */
  discountValue: number;
  /** ISO 8601 timestamp when the promotion starts. */
  validFrom: string;
  /** ISO 8601 timestamp when the promotion expires. */
  validUntil: string;
  /** Corridors this promotion applies to; empty array means all corridors. */
  corridors: import('./provider').Corridor[];
}
