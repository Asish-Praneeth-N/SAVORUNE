import { Scale } from 'lucide-react';

export function CapacityMeter({
  dailyCapacityKg,
  committedTodayKg,
  remainingCapacityKg,
}: {
  dailyCapacityKg: number;
  committedTodayKg: number;
  remainingCapacityKg: number;
}) {
  const percentCommitted = Math.min(
    100,
    Math.round((committedTodayKg / (dailyCapacityKg || 1)) * 100)
  );

  return (
    <div className="rounded-xl border border-forest/15 bg-surface p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-forest flex items-center gap-1.5 uppercase tracking-wider">
          <Scale className="w-4 h-4 text-natural" />
          Remaining Daily Capacity
        </span>
        <span className="font-mono font-bold text-natural text-sm">
          {remainingCapacityKg.toFixed(1)} kg left
        </span>
      </div>

      <div className="h-2 w-full bg-forest/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentCommitted >= 90 ? 'bg-rose-500' : 'bg-natural'
          }`}
          style={{ width: `${percentCommitted}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-forest/70 font-mono">
        <span>Committed: {committedTodayKg.toFixed(1)} kg ({percentCommitted}%)</span>
        <span>Daily Limit: {dailyCapacityKg.toFixed(0)} kg</span>
      </div>
    </div>
  );
}
