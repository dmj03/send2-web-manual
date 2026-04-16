import type { ProviderFee } from '@/types/provider';

interface ProviderFeeTableProps {
  fees: ProviderFee[];
}

const TRANSFER_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  cash_pickup: 'Cash pickup',
  wallet: 'Wallet',
  debit_card: 'Debit card',
  credit_card: 'Credit card',
};

function formatFee(fixed: number, pct: number, currency: string): string {
  const parts: string[] = [];
  if (fixed > 0) parts.push(`${currency} ${fixed.toFixed(2)}`);
  if (pct > 0) parts.push(`${(pct * 100).toFixed(2)}%`);
  return parts.length > 0 ? parts.join(' + ') : 'Free';
}

function formatAmountRange(min: number, max: number | null, currency: string): string {
  if (max === null) return `${currency} ${min.toLocaleString()}+`;
  return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()}`;
}

export function ProviderFeeTable({ fees }: ProviderFeeTableProps) {
  if (fees.length === 0) {
    return (
      <p className="text-sm text-gray-400">Fee information is not currently available.</p>
    );
  }

  return (
    <div className="space-y-6">
      {fees.map((feeSchedule, idx) => (
        <div key={idx}>
          {/* Method header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {TRANSFER_METHOD_LABELS[feeSchedule.transferMethod] ?? feeSchedule.transferMethod}
            </span>
            <span className="text-xs text-gray-400">
              {feeSchedule.corridor.sendCurrency} → {feeSchedule.corridor.receiveCurrency} (
              {feeSchedule.corridor.receiveCountry})
            </span>
          </div>

          {/* Tier table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5">Send amount</th>
                  <th className="px-4 py-2.5">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {feeSchedule.tiers.map((tier, tIdx) => (
                  <tr key={tIdx} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">
                      {formatAmountRange(
                        tier.minAmount,
                        tier.maxAmount,
                        feeSchedule.corridor.sendCurrency,
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {formatFee(tier.fixedFee, tier.percentageFee, feeSchedule.feeCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
