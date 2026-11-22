'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { Pickup } from '@/lib/types';
import { StatusChip } from '@/components/status-chip';
import { CountdownTimer } from '@/components/countdown-timer';

export default function PickupsListPage() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pickups')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setPickups(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-forest/15 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest flex items-center gap-2">
            <Truck className="w-6 h-6 text-natural" />
            Pickups &amp; Redistribution Operations
          </h1>
          <p className="text-xs text-forest/70 mt-1">
            Active and completed surplus food collections across the redistribution network.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-forest/60">
          Loading pickups...
        </div>
      ) : pickups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-forest/20 bg-surface p-12 text-center text-xs text-forest/70">
          No pickups found in your active queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pickups.map((p) => (
            <Link
              key={p.id}
              href={`/pickups/${p.id}`}
              className="group rounded-xl border border-forest/15 bg-surface p-5 shadow-sm hover:border-natural/40 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-bold text-base text-forest group-hover:text-natural transition-colors">
                    {p.donation?.title || 'Surplus Offering'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-forest/60 font-mono mt-0.5">
                    <span className="font-bold text-natural">{p.donation?.quantityKg} kg</span>
                    <span>·</span>
                    <span>For {p.receiverName}</span>
                  </div>
                </div>
                <StatusChip status={p.status} />
              </div>

              <div className="flex items-center justify-between text-xs text-forest/70 pt-2 border-t border-forest/10 font-mono">
                <span>Method: {p.collectorType === 'RECEIVER' ? 'Self-Collect' : 'Volunteer'}</span>
                {p.donation?.pickupDeadline && (
                  <CountdownTimer deadlineIso={p.donation.pickupDeadline} />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
