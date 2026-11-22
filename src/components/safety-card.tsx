import { StorageCondition, AllergenStatus, Allergen } from '@/lib/types';
import {
  STORAGE_HANDLING_GUIDANCE,
  DISCLAIMER_TEXT,
} from '@/lib/constants';
import {
  Thermometer,
  Snowflake,
  Sun,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';

export function SafetyCard({
  storageCondition,
  allergenStatus,
  allergens = [],
  preparedAt,
  pickupDeadline,
}: {
  storageCondition: StorageCondition;
  allergenStatus: AllergenStatus;
  allergens?: Allergen[];
  preparedAt?: string | null;
  pickupDeadline?: string;
}) {
  let StorageIcon = Thermometer;
  let storageLabel = 'Hot-Held (>63°C)';
  if (storageCondition === 'CHILLED') {
    StorageIcon = Snowflake;
    storageLabel = 'Chilled (<5°C)';
  } else if (storageCondition === 'AMBIENT') {
    StorageIcon = Sun;
    storageLabel = 'Ambient Storage';
  } else if (storageCondition === 'FROZEN') {
    StorageIcon = Snowflake;
    storageLabel = 'Frozen (<-18°C)';
  }

  const guidance = STORAGE_HANDLING_GUIDANCE[storageCondition];

  return (
    <div className="rounded-xl border border-natural/20 bg-surface p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-forest/10 pb-3">
        <h3 className="font-heading text-base font-bold text-forest flex items-center gap-2">
          <Info className="w-5 h-5 text-natural" />
          Food Safety & Handling Information
        </h3>
        <span className="text-xs bg-natural/10 text-natural font-medium px-2.5 py-0.5 rounded-full">
          PRD Guardrail
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Storage Guidance */}
        <div className="rounded-lg bg-background p-3.5 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-forest">
            <StorageIcon className="w-4 h-4 text-natural" />
            <span>Storage Condition: {storageLabel}</span>
          </div>
          <p className="text-xs text-forest/80 leading-relaxed">{guidance}</p>
        </div>

        {/* Allergen Information */}
        <div className="rounded-lg bg-background p-3.5 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-forest">
            <ShieldAlert className="w-4 h-4 text-natural" />
            <span>Allergen Declaration</span>
          </div>

          {allergenStatus === 'NONE_DECLARED' && (
            <p className="text-xs text-emerald-700 font-medium">
              No declared allergens by donor.
            </p>
          )}

          {allergenStatus === 'DECLARED' && (
            <div className="space-y-1.5">
              <span className="text-xs text-forest/70">Contains:</span>
              <div className="flex flex-wrap gap-1.5">
                {allergens.map((a) => (
                  <span
                    key={a}
                    className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {allergenStatus === 'UNKNOWN' && (
            <div className="flex items-start gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Allergen status is undeclared/unknown. Those with food sensitivities must proceed with caution.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Preparation & Deadline metadata */}
      <div className="flex flex-wrap items-center justify-between text-xs text-forest/70 pt-2 border-t border-forest/10">
        <div>
          <span>Preparation Time: </span>
          <strong>
            {preparedAt
              ? new Date(preparedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Preparation time not provided'}
          </strong>
        </div>
        {pickupDeadline && (
          <div>
            <span>Collection Deadline: </span>
            <strong className="text-forest">
              {new Date(pickupDeadline).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
          </div>
        )}
      </div>

      {/* Verbatim Disclaimer Banner (Section 21.1) */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-900">
        <p className="font-semibold text-[11px] uppercase tracking-wider text-amber-800 mb-0.5">
          Important Legal Notice
        </p>
        <p className="italic">{DISCLAIMER_TEXT}</p>
      </div>
    </div>
  );
}
