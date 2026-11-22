'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { getMinutesRemaining } from '@/lib/urgency';

export function CountdownTimer({
  deadlineIso,
  label = 'Pickup deadline',
}: {
  deadlineIso: string;
  label?: string;
}) {
  const [mins, setMins] = useState<number>(() => getMinutesRemaining(deadlineIso));

  useEffect(() => {
    const timer = setInterval(() => {
      setMins(getMinutesRemaining(deadlineIso));
    }, 10000); // 10s polling/update (PRD Assumption A5)
    return () => clearInterval(timer);
  }, [deadlineIso]);

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  const isUrgent = mins > 0 && mins <= 30;
  const isExpired = mins <= 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-xs font-semibold ${
        isExpired
          ? 'bg-gray-100 text-gray-500 border border-gray-200'
          : isUrgent
          ? 'bg-[#F2A65A]/20 text-[#B45309] border border-[#F2A65A]'
          : 'bg-forest/5 text-forest border border-forest/15'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] animate-bounce" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-forest/70" />
      )}
      <span>{label}:</span>
      <span>
        {isExpired
          ? 'Expired'
          : hours > 0
          ? `${hours}h ${remainingMins}m remaining`
          : `${remainingMins}m remaining`}
      </span>
    </div>
  );
}
