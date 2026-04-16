import type { SpeedEstimate } from '@/types/provider';

interface ProviderSpeedInfoProps {
  speedEstimates: SpeedEstimate[];
}

const TRANSFER_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  cash_pickup: 'Cash pickup',
  wallet: 'Wallet',
  debit_card: 'Debit card',
  credit_card: 'Credit card',
};

function SpeedIcon({ minutes }: { minutes: number }) {
  // Colour-coded by speed: <60min = green, <1440min = amber, else gray
  const isInstant = minutes < 60;
  const isSameDay = minutes < 1440;
  const colorClass = isInstant
    ? 'text-green-500'
    : isSameDay
      ? 'text-amber-500'
      : 'text-gray-400';

  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 ${colorClass}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function ProviderSpeedInfo({ speedEstimates }: ProviderSpeedInfoProps) {
  if (speedEstimates.length === 0) {
    return (
      <p className="text-sm text-gray-400">Speed estimates are not currently available.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {speedEstimates.map((est, i) => (
        <li key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <SpeedIcon minutes={est.minMinutes} />
            <span>{TRANSFER_METHOD_LABELS[est.transferMethod] ?? est.transferMethod}</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{est.label}</span>
        </li>
      ))}
    </ul>
  );
}
