/**
 * Quiz feature domain types.
 *
 * The quiz is a 5-step guided wizard that collects the user's transfer
 * preferences and returns a ranked list of recommended providers.
 */

import type { SearchFilters, SortField } from '@/types/search';
import type { TransferMethod } from '@/types/provider';

// ---------------------------------------------------------------------------
// Step IDs
// ---------------------------------------------------------------------------

export type QuizStepId =
  | 'amount'
  | 'destination'
  | 'frequency'
  | 'urgency'
  | 'priority';

// ---------------------------------------------------------------------------
// Individual step answer shapes
// ---------------------------------------------------------------------------

export interface AmountAnswer {
  sendAmount: number;
  sendCurrency: string;
}

export type FrequencyValue = 'one_time' | 'weekly' | 'monthly' | 'irregular';

export type UrgencyValue = 'asap' | 'within_day' | 'within_3_days' | 'cheapest';

export type PriorityValue = 'lowest_fee' | 'best_rate' | 'highest_rated' | 'fastest';

// ---------------------------------------------------------------------------
// Full quiz answers (partially filled during the wizard)
// ---------------------------------------------------------------------------

export interface QuizAnswers {
  amount: AmountAnswer | null;
  destination: string | null; // ISO 3166-1 alpha-2 country code
  frequency: FrequencyValue | null;
  urgency: UrgencyValue | null;
  priority: PriorityValue | null;
}

// ---------------------------------------------------------------------------
// Quiz step metadata
// ---------------------------------------------------------------------------

export interface QuizStepMeta {
  id: QuizStepId;
  index: number;
  title: string;
  subtitle: string;
}

export const QUIZ_STEPS: QuizStepMeta[] = [
  {
    id: 'amount',
    index: 0,
    title: 'How much are you sending?',
    subtitle: 'Enter the amount you want to transfer',
  },
  {
    id: 'destination',
    index: 1,
    title: 'Where are you sending?',
    subtitle: 'Choose the destination country',
  },
  {
    id: 'frequency',
    index: 2,
    title: 'How often do you send?',
    subtitle: 'This helps us find providers with the best loyalty rewards',
  },
  {
    id: 'urgency',
    index: 3,
    title: 'How quickly does it need to arrive?',
    subtitle: 'Select your preferred delivery speed',
  },
  {
    id: 'priority',
    index: 4,
    title: "What matters most to you?",
    subtitle: 'We\'ll rank our recommendations accordingly',
  },
];

// ---------------------------------------------------------------------------
// Option definitions
// ---------------------------------------------------------------------------

export interface QuizOptionDef<V = string> {
  value: V;
  label: string;
  description: string;
  icon: string;
}

export const DESTINATION_OPTIONS: Array<{ code: string; name: string; flag: string; currency: string }> = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
];

export const FREQUENCY_OPTIONS: QuizOptionDef<FrequencyValue>[] = [
  {
    value: 'one_time',
    label: 'One time',
    description: 'A single transfer',
    icon: '1️⃣',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Regular weekly transfers',
    icon: '📅',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Regular monthly transfers',
    icon: '🗓️',
  },
  {
    value: 'irregular',
    label: 'Irregular',
    description: 'Whenever I need to',
    icon: '🔀',
  },
];

export const URGENCY_OPTIONS: QuizOptionDef<UrgencyValue>[] = [
  {
    value: 'asap',
    label: 'As soon as possible',
    description: 'Minutes to a few hours',
    icon: '⚡',
  },
  {
    value: 'within_day',
    label: 'Within 24 hours',
    description: 'Same or next day',
    icon: '🌅',
  },
  {
    value: 'within_3_days',
    label: 'Within 2–3 days',
    description: 'A couple of business days is fine',
    icon: '📆',
  },
  {
    value: 'cheapest',
    label: 'Whenever — cheapest first',
    description: 'I\'ll wait for the best deal',
    icon: '💰',
  },
];

export const PRIORITY_OPTIONS: QuizOptionDef<PriorityValue>[] = [
  {
    value: 'lowest_fee',
    label: 'Lowest fees',
    description: 'Minimise what I pay to send',
    icon: '🏷️',
  },
  {
    value: 'best_rate',
    label: 'Best exchange rate',
    description: 'Maximise what my recipient gets',
    icon: '📈',
  },
  {
    value: 'highest_rated',
    label: 'Highest rated',
    description: 'Most trusted by other senders',
    icon: '⭐',
  },
  {
    value: 'fastest',
    label: 'Fastest transfer',
    description: 'Speed over everything',
    icon: '🚀',
  },
];

// ---------------------------------------------------------------------------
// Maps from quiz answers → API SearchFilters
// ---------------------------------------------------------------------------

export const urgencyToTransferMethod: Record<UrgencyValue, TransferMethod | undefined> = {
  asap: 'debit_card',
  within_day: 'bank_transfer',
  within_3_days: 'bank_transfer',
  cheapest: undefined,
};

export const priorityToSortField: Record<PriorityValue, SortField> = {
  lowest_fee: 'totalCost',
  best_rate: 'exchangeRate',
  highest_rated: 'rating',
  fastest: 'transferSpeed',
};

/** Convert completed quiz answers to a SearchFilters object for the API. */
export function quizAnswersToSearchFilters(answers: QuizAnswers): SearchFilters | null {
  if (!answers.amount || !answers.destination) return null;

  const dest = DESTINATION_OPTIONS.find((d) => d.code === answers.destination);
  if (!dest) return null;

  const transferMethod = answers.urgency
    ? urgencyToTransferMethod[answers.urgency]
    : undefined;

  return {
    sendAmount: answers.amount.sendAmount,
    sendCurrency: answers.amount.sendCurrency,
    receiveCountry: dest.code,
    receiveCurrency: dest.currency,
    ...(transferMethod ? { transferMethod } : {}),
  };
}

/** Derive preferred sort field from quiz priority answer. */
export function quizPriorityToSortField(priority: PriorityValue | null): SortField {
  return priority ? priorityToSortField[priority] : 'totalCost';
}
