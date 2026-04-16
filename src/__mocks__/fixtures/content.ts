import type { Article, Promotion, ArticleCategory } from '@/types/content';

export const mockArticle: Article = {
  id: 'art_01',
  slug: 'best-ways-to-send-money-nigeria-2025',
  title: 'Best Ways to Send Money to Nigeria in 2025',
  excerpt:
    'A comprehensive guide to the cheapest, fastest providers for GBP to NGN transfers this year.',
  body: '<p>With over 1.7 million Nigerians living in the UK, remittance corridors have never been more competitive...</p>',
  featuredImageUrl: 'https://cdn.send2.io/articles/gbp-ngn-guide-2025.jpg',
  category: 'guides',
  tags: ['Nigeria', 'GBP', 'remittance', '2025'],
  author: {
    id: 'auth_01',
    name: 'Chinonso Eze',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chinonso',
    bio: null,
  },
  publishedAt: '2025-01-15T09:00:00.000Z',
  updatedAt: '2025-03-01T12:00:00.000Z',
  isSponsored: false,
};

export const mockArticles: Article[] = [
  mockArticle,
  {
    id: 'art_02',
    slug: 'wise-vs-remitly-2025-comparison',
    title: 'Wise vs Remitly 2025: Which Is Better for International Transfers?',
    excerpt:
      'We compared fees, exchange rates, speed, and customer support to find out which provider wins.',
    body: '<p>Wise and Remitly are two of the most popular money transfer services...</p>',
    featuredImageUrl: 'https://cdn.send2.io/articles/wise-vs-remitly-2025.jpg',
    category: 'reviews' as ArticleCategory,
    tags: ['Wise', 'Remitly', 'comparison'],
    author: {
      id: 'auth_02',
      name: 'Sophie Clarke',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sophie',
      bio: null,
    },
    publishedAt: '2025-02-10T10:00:00.000Z',
    updatedAt: '2025-02-10T10:00:00.000Z',
    isSponsored: false,
  },
  {
    id: 'art_03',
    slug: 'understanding-exchange-rate-margins',
    title: "Understanding Exchange Rate Margins: What Providers Won't Tell You",
    excerpt:
      "Hidden exchange rate markups can cost you more than headline fees. Here's how to spot them.",
    body: '<p>When a provider advertises "no fees", look closely at the exchange rate they offer...</p>',
    featuredImageUrl: 'https://cdn.send2.io/articles/exchange-rate-margins.jpg',
    category: 'tips' as ArticleCategory,
    tags: ['exchange rate', 'fees', 'transparency'],
    author: {
      id: 'auth_01',
      name: 'Chinonso Eze',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chinonso',
      bio: null,
    },
    publishedAt: '2025-03-05T08:00:00.000Z',
    updatedAt: '2025-04-02T11:00:00.000Z',
    isSponsored: false,
  },
];

export const mockPromotion: Promotion = {
  id: 'promo_01',
  providerId: 'prov_wise',
  title: 'First Transfer Free',
  description: 'New Wise users pay zero fees on their first transfer up to £1,000.',
  promoCode: null,
  discountType: 'fee_waived',
  discountValue: 0,
  validFrom: '2025-04-01T00:00:00.000Z',
  validUntil: '2025-06-30T23:59:59.000Z',
  corridors: [],
};

export const mockPromotions: Promotion[] = [
  mockPromotion,
  {
    id: 'promo_02',
    providerId: 'prov_remitly',
    title: 'Zero Fees This Weekend',
    description: 'Send to Nigeria with absolutely no transfer fees this weekend only.',
    promoCode: null,
    discountType: 'fee_waived',
    discountValue: 0,
    validFrom: '2025-04-12T00:00:00.000Z',
    validUntil: '2025-04-13T23:59:59.000Z',
    corridors: [],
  },
];
