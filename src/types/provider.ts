/**
 * Transfer provider domain types.
 * Covers provider metadata, pricing, corridors, fees, and search result enrichment.
 */

/** All supported transfer delivery methods. */
export type TransferMethod =
  | 'bank_transfer'
  | 'mobile_money'
  | 'cash_pickup'
  | 'wallet'
  | 'debit_card'
  | 'credit_card';

/** A send-currency / receive-country pair that a provider supports. */
export interface Corridor {
  /** ISO 4217 send currency code (e.g. "GBP"). */
  sendCurrency: string;
  /** ISO 3166-1 alpha-2 receive country code (e.g. "NG"). */
  receiveCountry: string;
  /** ISO 4217 receive currency code (e.g. "NGN"). */
  receiveCurrency: string;
}

/** A single fee tier within a fee schedule. */
export interface FeeTier {
  /** Minimum send amount (inclusive) for this tier, in the send currency. */
  minAmount: number;
  /** Maximum send amount (inclusive) for this tier, null means no upper bound. */
  maxAmount: number | null;
  /** Fixed fee component in the send currency. */
  fixedFee: number;
  /** Percentage fee component expressed as a decimal (e.g. 0.01 = 1 %). */
  percentageFee: number;
}

/** Complete fee schedule for a provider on a specific corridor. */
export interface ProviderFee {
  corridor: Corridor;
  transferMethod: TransferMethod;
  tiers: FeeTier[];
  /** ISO 4217 currency code the fee is charged in. */
  feeCurrency: string;
}

/** Estimated transfer speed for a provider + method combination. */
export interface SpeedEstimate {
  transferMethod: TransferMethod;
  /** Minimum delivery time in minutes. */
  minMinutes: number;
  /** Maximum delivery time in minutes. */
  maxMinutes: number;
  /** Human-readable label shown in the UI (e.g. "Within 24 hours"). */
  label: string;
}

/** Core provider record as stored in the directory. */
export interface Provider {
  id: string;
  name: string;
  /** URL-safe unique identifier (e.g. "wise", "remitly"). */
  slug: string;
  /** Absolute URL of the provider's logo. */
  logoUrl: string;
  /** Average user rating on a 0–5 scale. */
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  description: string;
  website: string;
  supportedCorridors: Corridor[];
  transferMethods: TransferMethod[];
  fees: ProviderFee[];
  speedEstimates: SpeedEstimate[];
  /** Arbitrary searchable tags (e.g. "no-fx-markup", "crypto"). */
  tags: string[];
}

/**
 * Provider enriched with live quote data for a specific search query.
 * Extends the base Provider with per-quote computed fields.
 */
export interface ProviderResult extends Provider {
  /** Exchange rate applied to this quote. */
  exchangeRate: number;
  /** Amount the recipient receives in the receive currency. */
  recipientAmount: number;
  /** Total cost to the sender including all fees, in the send currency. */
  totalCost: number;
  /** Chosen transfer method for this result. */
  transferMethod: TransferMethod;
  /** Estimated transfer speed label for the chosen method. */
  transferSpeed: string;
  /** Promotional code to apply at checkout, if active. */
  promoCode: string | null;
  /** Short label describing the active promotion (e.g. "First transfer free"). */
  promoLabel: string | null;
}
