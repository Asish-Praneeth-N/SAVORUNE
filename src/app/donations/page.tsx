'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Filter,
  Search,
  Scale,
  Clock,
  ArrowRight,
  PackageCheck,
  PlusCircle,
} from 'lucide-react';
import { Donation } from '@/lib/types';
import { StatusChip, UrgencyBadge } from '@/components/status-chip';
import { CountdownTimer } from '@/components/countdown-timer';

export default function DonationsListPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/donations?status=${statusFilter}`);
      const json = await res.json();
      if (json.data) setDonations(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const filtered = donations.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-natural" />
            Surplus Food Offerings
          </h1>
          <p className="text-xs text-forest/70 mt-1">
            Browse available, active, and completed surplus food listings across the network.
          </p>
        </div>

        <Link
          href="/donations/new"
          className="rounded-full bg-natural px-5 py-2.5 text-xs font-bold text-background hover:bg-natural/90 transition-colors shadow-sm flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4 text-lime" />
          Post Surplus (&lt;60s)
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-forest/15 shadow-sm text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-forest/50" />
          <input
            type="text"
            placeholder="Search by food name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-forest focus:outline-none placeholder:text-forest/40 w-full sm:w-64"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'POSTED', 'CLAIMED', 'COLLECTED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-forest text-background'
                  : 'bg-background text-forest/70 hover:bg-forest/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-forest/60">
          Loading surplus listings...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-forest/20 bg-surface p-12 text-center text-xs text-forest/70">
          No donations found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/donations/${d.id}`}
              className="group rounded-xl border border-forest/15 bg-surface p-5 shadow-sm hover:border-natural/40 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-bold text-base text-forest group-hover:text-natural transition-colors">
                    {d.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-forest/60 font-mono mt-0.5">
                    <span className="font-bold text-natural">{d.quantityKg} kg</span>
                    <span>·</span>
                    <span>{d.category.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>{d.dietType}</span>
                  </div>
                </div>
                <StatusChip status={d.status} />
              </div>

              <div className="flex items-center justify-between text-xs text-forest/70 pt-2 border-t border-forest/10 font-mono">
                <CountdownTimer deadlineIso={d.pickupDeadline} />
                <UrgencyBadge urgency={d.urgency} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
