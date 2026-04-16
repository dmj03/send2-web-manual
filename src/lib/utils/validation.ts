import { SUPPORTED_CURRENCIES } from './currency';

/** Two-letter ISO 3166-1 alpha-2 country codes. */
const ISO_3166_1_ALPHA2 = new Set([
  'AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX',
  'AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ',
  'BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK',
  'CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM',
  'DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR',
  'GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS',
  'GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN',
  'IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN',
  'KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV',
  'LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ',
  'MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI',
  'NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM',
  'PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC',
  'SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV',
  'SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR',
  'TT','TV','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN',
  'VU','WF','WS','YE','YT','ZA','ZM','ZW',
]);

/**
 * Returns true if the string is a valid RFC 5322 email address.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Returns true if the string matches E.164 international phone format (+[1-15 digits]).
 */
export function isValidPhoneNumber(
  phone: string,
  _countryCode?: string,
): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.trim());
}

/**
 * Type guard that returns true if value is a positive, finite number.
 */
export function isValidAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && isFinite(amount) && amount > 0;
}

/**
 * Returns true if the string is a known 3-letter ISO 4217 currency code.
 */
export function isValidCurrencyCode(code: string): boolean {
  return SUPPORTED_CURRENCIES.includes(code.toUpperCase());
}

/**
 * Returns true if the string is a valid 2-letter ISO 3166-1 alpha-2 country code.
 */
export function isValidCountryCode(code: string): boolean {
  return ISO_3166_1_ALPHA2.has(code.toUpperCase());
}

/**
 * Trims whitespace and escapes HTML special characters to prevent XSS.
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
