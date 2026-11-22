import { DonationStatus, UrgencyLabel } from '@/lib/types';
import { getUrgency } from '@/lib/urgency';
import { AlertTriangle, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export function StatusChip({ status }: { status: DonationStatus | string }) {
  switch (status) {
    case 'POSTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          POSTED
        </span>
      );
    case 'CLAIMED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          CLAIMED
        </span>
      );
    case 'COLLECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
          <RotateCcw className="w-3 h-3 text-indigo-600" />
          COLLECTED
        </span>
      );
    case 'DELIVERED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-900 border border-green-400">
          <CheckCircle2 className="w-3 h-3 text-green-700" />
          DELIVERED
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <XCircle className="w-3 h-3 text-gray-500" />
          EXPIRED
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3 h-3 text-rose-600" />
          CANCELLED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
}

export function UrgencyBadge({ urgency, deadline }: { urgency?: UrgencyLabel; deadline?: string }) {
  let effectiveUrgency: UrgencyLabel | undefined = urgency;
  if (!effectiveUrgency && deadline) {
    const res = getUrgency(deadline);
    if (res !== 'EXPIRED') {
      effectiveUrgency = res;
    }
  }
  if (!effectiveUrgency) return null;

  if (effectiveUrgency === 'URGENT') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-[#F2A65A]/20 text-[#C46A14] border border-[#F2A65A]/50">
        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
        URGENT (&lt;30m)
      </span>
    );
  }

  if (urgency === 'EXPIRING_SOON') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        EXPIRING SOON
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      AVAILABLE
    </span>
  );
}
