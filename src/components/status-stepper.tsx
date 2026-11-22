import { DonationStatus } from '@/lib/types';
import { Check, Circle } from 'lucide-react';

export function StatusStepper({
  status,
  history = [],
}: {
  status: DonationStatus | string;
  history?: any[];
}) {
  const steps: { key: DonationStatus; label: string }[] = [
    { key: 'POSTED', label: 'Posted' },
    { key: 'CLAIMED', label: 'Claimed' },
    { key: 'COLLECTED', label: 'Collected' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const statusIndexMap: Record<string, number> = {
    POSTED: 0,
    CLAIMED: 1,
    COLLECTED: 2,
    DELIVERED: 3,
    EXPIRED: -1,
    CANCELLED: -2,
  };

  const currentIndex = statusIndexMap[status] ?? 0;
  const isTerminalFailure = currentIndex < 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-forest/10 -translate-y-1/2 z-0" />

        {steps.map((step, idx) => {
          const isCompleted = !isTerminalFailure && currentIndex >= idx;
          const isCurrent = !isTerminalFailure && currentIndex === idx;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-natural text-background'
                    : isCurrent
                    ? 'bg-lime text-forest border-2 border-forest ring-2 ring-lime/40'
                    : 'bg-surface text-forest/40 border border-forest/20'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  isCurrent
                    ? 'text-forest font-bold'
                    : isCompleted
                    ? 'text-natural'
                    : 'text-forest/40'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isTerminalFailure && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>Lifecycle closed early with terminal status:</span>
          <strong className="uppercase font-bold tracking-wide">{status}</strong>
        </div>
      )}

      {/* History Events List */}
      {history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-forest/10 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-forest/70">
            Lifecycle Audit Log (PRD Section 16.2)
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((h, i) => (
              <div
                key={h.id || i}
                className="flex items-start justify-between text-xs bg-background p-2 rounded border border-forest/10"
              >
                <div className="flex items-start gap-1.5">
                  <Circle className="w-2.5 h-2.5 text-natural shrink-0 mt-1" />
                  <div>
                    <span className="font-semibold text-forest">
                      {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                    </span>
                    {h.note && <p className="text-forest/70 text-[11px]">{h.note}</p>}
                  </div>
                </div>
                <div className="text-right text-[10px] text-forest/60 font-mono shrink-0 ml-2">
                  <span>{h.actorRole}</span>
                  <div>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
