import type {
  Provider,
  ProviderResult,
  TransferMethod,
  Corridor,
  ProviderFee,
  SpeedEstimate,
} from '@/types/provider';

/** Local review shape — not exported from @/types/provider */
export interface ProviderReviewData {
  id: string;
  providerId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verified: boolean;
}

const gbpToNgnCorridor: Corridor = {
  sendCurrency: 'GBP',
  receiveCountry: 'NG',
  receiveCurrency: 'NGN',
};

const gbpToUsdCorridor: Corridor = {
  sendCurrency: 'GBP',
  receiveCountry: 'US',
  receiveCurrency: 'USD',
};

const wiseFeeGbpNgn: ProviderFee = {
  corridor: gbpToNgnCorridor,
  transferMethod: 'bank_transfer',
  tiers: [
    { minAmount: 1, maxAmount: 500, fixedFee: 0.92, percentageFee: 0.0041 },
    { minAmount: 501, maxAmount: null, fixedFee: 0.92, percentageFee: 0.0041 },
  ],
  feeCurrency: 'GBP',
};

const wiseSpeedEstimate: SpeedEstimate = {
  transferMethod: 'bank_transfer',
  minMinutes: 0,
  maxMinutes: 60,
  label: 'Within 1 hour',
};

export const mockProviderWise: Provider = {
  id: 'prov_wise',
  slug: 'wise',
  name: 'Wise',
  logoUrl: 'https://cdn.send2.io/logos/wise.svg',
  website: 'https://wise.com',
  description:
    'Wise (formerly TransferWise) offers real mid-market exchange rates with low, transparent fees.',
  rating: 4.7,
  reviewCount: 14203,
  isFeatured: true,
  isVerified: true,
  transferMethods: ['bank_transfer', 'debit_card', 'credit_card'] as TransferMethod[],
  supportedCorridors: [gbpToNgnCorridor, gbpToUsdCorridor],
  fees: [wiseFeeGbpNgn],
  speedEstimates: [wiseSpeedEstimate],
  tags: ['mid-market-rate', 'transparent-fees'],
};

const remitlyFee: ProviderFee = {
  corridor: gbpToNgnCorridor,
  transferMethod: 'bank_transfer',
  tiers: [
    { minAmount: 1, maxAmount: 999, fixedFee: 2.99, percentageFee: 0.0 },
    { minAmount: 1000, maxAmount: null, fixedFee: 0.0, percentageFee: 0.0 },
  ],
  feeCurrency: 'GBP',
};

const remitlySpeed: SpeedEstimate = {
  transferMethod: 'bank_transfer',
  minMinutes: 0,
  maxMinutes: 4320,
  label: '1–3 days',
};

export const mockProviderRemitly: Provider = {
  id: 'prov_remitly',
  slug: 'remitly',
  name: 'Remitly',
  logoUrl: 'https://cdn.send2.io/logos/remitly.svg',
  website: 'https://remitly.com',
  description:
    'Remitly specialises in fast, secure international money transfers with competitive rates for major corridors.',
  rating: 4.5,
  reviewCount: 9871,
  isFeatured: true,
  isVerified: true,
  transferMethods: ['bank_transfer', 'mobile_money', 'cash_pickup'] as TransferMethod[],
  supportedCorridors: [gbpToNgnCorridor],
  fees: [remitlyFee],
  speedEstimates: [remitlySpeed],
  tags: [],
};

const worldRemitFee: ProviderFee = {
  corridor: gbpToNgnCorridor,
  transferMethod: 'mobile_money',
  tiers: [{ minAmount: 1, maxAmount: null, fixedFee: 1.99, percentageFee: 0.0 }],
  feeCurrency: 'GBP',
};

const worldRemitSpeed: SpeedEstimate = {
  transferMethod: 'mobile_money',
  minMinutes: 60,
  maxMinutes: 2880,
  label: '1–2 days',
};

export const mockProviderWorldRemit: Provider = {
  id: 'prov_worldremit',
  slug: 'worldremit',
  name: 'WorldRemit',
  logoUrl: 'https://cdn.send2.io/logos/worldremit.svg',
  website: 'https://worldremit.com',
  description:
    'WorldRemit connects senders to over 130 countries with a range of delivery methods including mobile money.',
  rating: 4.2,
  reviewCount: 6540,
  isFeatured: false,
  isVerified: true,
  transferMethods: ['bank_transfer', 'mobile_money', 'cash_pickup', 'wallet'] as TransferMethod[],
  supportedCorridors: [gbpToNgnCorridor, gbpToUsdCorridor],
  fees: [worldRemitFee],
  speedEstimates: [worldRemitSpeed],
  tags: ['mobile-money'],
};

const wuFee: ProviderFee = {
  corridor: gbpToNgnCorridor,
  transferMethod: 'cash_pickup',
  tiers: [
    { minAmount: 1, maxAmount: 300, fixedFee: 4.9, percentageFee: 0.0 },
    { minAmount: 301, maxAmount: null, fixedFee: 9.9, percentageFee: 0.0 },
  ],
  feeCurrency: 'GBP',
};

const wuSpeed: SpeedEstimate = {
  transferMethod: 'cash_pickup',
  minMinutes: 0,
  maxMinutes: 7200,
  label: '3–5 days',
};

export const mockProviderWesternUnion: Provider = {
  id: 'prov_wu',
  slug: 'western-union',
  name: 'Western Union',
  logoUrl: 'https://cdn.send2.io/logos/western-union.svg',
  website: 'https://westernunion.com',
  description:
    'Western Union has a vast global network of agent locations for in-person cash pickup alongside digital transfers.',
  rating: 3.8,
  reviewCount: 22100,
  isFeatured: false,
  isVerified: true,
  transferMethods: ['bank_transfer', 'cash_pickup', 'debit_card'] as TransferMethod[],
  supportedCorridors: [gbpToNgnCorridor, gbpToUsdCorridor],
  fees: [wuFee],
  speedEstimates: [wuSpeed],
  tags: ['cash-pickup', 'global-network'],
};

const moneyGramFee: ProviderFee = {
  corridor: gbpToNgnCorridor,
  transferMethod: 'bank_transfer',
  tiers: [
    { minAmount: 1, maxAmount: 200, fixedFee: 3.99, percentageFee: 0.0 },
    { minAmount: 201, maxAmount: null, fixedFee: 6.99, percentageFee: 0.0 },
  ],
  feeCurrency: 'GBP',
};

const moneyGramSpeed: SpeedEstimate = {
  transferMethod: 'bank_transfer',
  minMinutes: 0,
  maxMinutes: 5760,
  label: '1–4 days',
};

export const mockProviderMoneyGram: Provider = {
  id: 'prov_moneygram',
  slug: 'moneygram',
  name: 'MoneyGram',
  logoUrl: 'https://cdn.send2.io/logos/moneygram.svg',
  website: 'https://moneygram.com',
  description:
    'MoneyGram offers flexible money transfer options with extensive cash pickup locations worldwide.',
  rating: 3.6,
  reviewCount: 11450,
  isFeatured: false,
  isVerified: true,
  transferMethods: ['bank_transfer', 'cash_pickup', 'debit_card', 'credit_card'] as TransferMethod[],
  supportedCorridors: [gbpToNgnCorridor],
  fees: [moneyGramFee],
  speedEstimates: [moneyGramSpeed],
  tags: ['cash-pickup'],
};

export const mockProviders: Provider[] = [
  mockProviderWise,
  mockProviderRemitly,
  mockProviderWorldRemit,
  mockProviderWesternUnion,
  mockProviderMoneyGram,
];

/** ProviderResult — Provider enriched with live quote data for a specific search */
export const mockProviderResultWise: ProviderResult = {
  ...mockProviderWise,
  exchangeRate: 1668.78,
  recipientAmount: 832_540.25,
  totalCost: 503.0,
  transferMethod: 'bank_transfer',
  transferSpeed: '< 2 hours',
  promoCode: null,
  promoLabel: null,
};

export const mockProviderResultRemitly: ProviderResult = {
  ...mockProviderRemitly,
  exchangeRate: 1641.5,
  recipientAmount: 819_250.0,
  totalCost: 502.99,
  transferMethod: 'bank_transfer',
  transferSpeed: '1–3 days',
  promoCode: null,
  promoLabel: null,
};

export const mockProviderResultWorldRemit: ProviderResult = {
  ...mockProviderWorldRemit,
  exchangeRate: 1625.6,
  recipientAmount: 811_800.0,
  totalCost: 501.99,
  transferMethod: 'mobile_money',
  transferSpeed: '1–2 days',
  promoCode: null,
  promoLabel: null,
};

export const mockProviderResultWesternUnion: ProviderResult = {
  ...mockProviderWesternUnion,
  exchangeRate: 1590.0,
  recipientAmount: 793_000.0,
  totalCost: 509.9,
  transferMethod: 'cash_pickup',
  transferSpeed: '3–5 days',
  promoCode: null,
  promoLabel: null,
};

export const mockProviderResultMoneyGram: ProviderResult = {
  ...mockProviderMoneyGram,
  exchangeRate: 1577.0,
  recipientAmount: 786_500.0,
  totalCost: 506.99,
  transferMethod: 'bank_transfer',
  transferSpeed: '1–4 days',
  promoCode: null,
  promoLabel: null,
};

export const mockProviderResults: ProviderResult[] = [
  mockProviderResultWise,
  mockProviderResultRemitly,
  mockProviderResultWorldRemit,
  mockProviderResultWesternUnion,
  mockProviderResultMoneyGram,
];

export const mockReviews: ProviderReviewData[] = [
  {
    id: 'rev_001',
    providerId: 'prov_wise',
    userId: 'usr_01HXYZ123456ABCDEF',
    userName: 'James O.',
    rating: 5,
    title: 'Best rates for GBP to NGN',
    body: 'Used Wise three times this month. Always the best rate and arrives within the hour.',
    createdAt: '2025-03-20T12:00:00.000Z',
    verified: true,
  },
  {
    id: 'rev_002',
    providerId: 'prov_wise',
    userId: 'usr_02',
    userName: 'Amara K.',
    rating: 4,
    title: 'Reliable but support can be slow',
    body: 'Transfers always complete on time. Customer support took 48h to respond once though.',
    createdAt: '2025-02-14T09:30:00.000Z',
    verified: true,
  },
  {
    id: 'rev_003',
    providerId: 'prov_wise',
    userId: 'usr_03',
    userName: 'David M.',
    rating: 5,
    title: 'Transparent fees — no surprises',
    body: 'The breakdown screen shows exactly what recipient gets before you confirm. Highly recommend.',
    createdAt: '2025-01-08T16:15:00.000Z',
    verified: false,
  },
];
