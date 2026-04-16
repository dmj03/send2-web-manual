interface RateAlertProgressBarProps {
  currentRate: number;
  targetRate: number;
  /** Lower rates are "closer to target" when sending to high-inflation currencies.
   *  The component always renders progress as (current / target) clamped to [0, 1].
   */
}

export function RateAlertProgressBar({
  currentRate,
  targetRate,
}: RateAlertProgressBarProps) {
  const pct = Math.min((currentRate / targetRate) * 100, 100);
  const isNearTarget = pct >= 90;
  const isTriggered = pct >= 100;

  const barColor = isTriggered
    ? 'bg-green-500'
    : isNearTarget
      ? 'bg-amber-400'
      : 'bg-blue-500';

  const labelColor = isTriggered
    ? 'text-green-700'
    : isNearTarget
      ? 'text-amber-700'
      : 'text-blue-700';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-gray-500">Current rate progress</span>
        <span className={labelColor}>{pct.toFixed(1)}% of target</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct.toFixed(1)}% of target rate reached`}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
