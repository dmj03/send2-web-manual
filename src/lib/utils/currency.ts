/** ISO 4217 currency codes supported by the Send2 platform. */
export const SUPPORTED_CURRENCIES: string[] = [
  'AED', 'AUD', 'BDT', 'BRL', 'CAD', 'CHF', 'CNY', 'COP', 'CZK', 'DKK',
  'EGP', 'EUR', 'GBP', 'GHS', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY',
  'KES', 'KRW', 'LKR', 'MAD', 'MXN', 'MYR', 'NGN', 'NOK', 'NPR', 'NZD',
  'PEN', 'PHP', 'PKR', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'TWD',
  'TZS', 'UAH', 'UGX', 'USD', 'VND', 'XAF', 'XOF', 'ZAR', 'ZMW',
];

/**
 * Formats a numeric amount as a localized currency string using Intl.NumberFormat.
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-GB',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an exchange rate as a human-readable string, e.g. "1 GBP = 1.2345 USD".
 */
export function formatExchangeRate(
  rate: number,
  fromCurrency: string,
  toCurrency: string,
): string {
  return `1 ${fromCurrency.toUpperCase()} = ${rate.toFixed(4)} ${toCurrency.toUpperCase()}`;
}

/**
 * Parses a currency input string by stripping symbols and returning a float, or null if invalid.
 */
export function parseCurrencyInput(input: string): number | null {
  const cleaned = input.replace(/[^0-9.\-]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return null;
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : null;
}

/**
 * Returns the currency symbol for a given ISO 4217 currency code and locale.
 */
export function getCurrencySymbol(
  currency: string,
  locale: string = 'en-GB',
): string {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(0);
  // Strip digits, spaces, and non-breaking spaces to isolate the symbol
  return formatted.replace(/[\d\s,.\u00A0]/g, '').trim();
}

/**
 * Rounds a number to a specified number of decimal places using the "round half away from zero" rule.
 */
export function roundToDecimalPlaces(value: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
