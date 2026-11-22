
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Award,
  Filter,
  AlertTriangle,
  Scale,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Match } from '@/lib/types';
import { MatchCard } from '@/components/match-card';
import { CapacityMeter } from '@/components/capacity-meter';

export default function RecommendationsPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [includeIneligible, setIncludeIneligible] = useState(false);
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG_ONLY'>('ALL');

  const fetchMatches = async (ineligible: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?includeIneligible=${ineligible}`);
      const json = await res.json();
      if (json.data) setMatches(json.data);
      if (json.meta) setMeta(json.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches(includeIneligible);
  }, [includeIneligible]);

  let filtered = matches;
  if (dietaryFilter === 'VEG_ONLY') {
    filtered = filtered.filter((m) => m.donation?.dietType === 'VEG');
  }

  const eligibleMatches = filtered.filter((m) => m.eligible);
  const ineligibleMatches = filtered.filter((m) => !m.eligible);

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-natural" />
            Smart Redistribution Matches
          </h1>
          <p className="text-xs text-forest/70 mt-1">
            Deterministic weighted scoring (Distance 30%, Quantity 25%, Timing 25%, Need 20%) with capacity-aware eligibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIncludeIneligible(!includeIneligible)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              includeIneligible
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-surface border-forest/20 text-forest/70 hover:text-forest'
            }`}
          >
            {includeIneligible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {includeIneligible ? 'Hide Ineligible' : 'Show Ineligible & Reasons'}
          </button>
        </div>
      </div>

      {/* 2. Remaining Daily Capacity Meter (FR-E8, Section 14.1) */}
      {meta && (
        <CapacityMeter
          dailyCapacityKg={meta.dailyCapacityKg}
          committedTodayKg={meta.committedTodayKg}
          remainingCapacityKg={meta.remainingCapacityKg}
        />
      )}

      {/* 3. Filter Controls */}
      <div className="flex items-center gap-3 text-xs font-semibold">
        <span className="text-forest/60 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Dietary Filter:
        </span>
        <button
          onClick={() => setDietaryFilter('ALL')}
          className={`px-3 py-1 rounded-full transition-colors ${
            dietaryFilter === 'ALL'
              ? 'bg-forest text-background'
              : 'bg-surface text-forest/70 hover:bg-forest/5'
          }`}
        >
          All Surplus
        </button>
        <button
          onClick={() => setDietaryFilter('VEG_ONLY')}
          className={`px-3 py-1 rounded-full transition-colors ${
            dietaryFilter === 'VEG_ONLY'
              ? 'bg-natural text-background'
              : 'bg-surface text-forest/70 hover:bg-forest/5'
          }`}
        >
          Vegetarian Only
        </button>
      </div>

      {/* 4. Ranked Eligible Recommendations (AC-3, AC-4) */}
      <div className="space-y-4">
        <h2 className="font-heading text-lg font-bold text-forest flex items-center gap-2">
          <Award className="w-5 h-5 text-natural" />
          Recommended Surplus for Your Facility ({eligibleMatches.length})
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-forest/60">
            Running deterministic matching algorithm...
          </div>
        ) : eligibleMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-forest/20 bg-surface p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-forest/30 mx-auto" />
            <p className="text-sm font-semibold text-forest">
              No matching surplus available right now within your capacity.
            </p>
            <p className="text-xs text-forest/60">
              Check back soon as local restaurants post dinner surplus, or view excluded offerings to see why.
            </p>
            <button
              onClick={() => setIncludeIneligible(true)}
              className="text-xs font-bold text-natural hover:underline"
            >
              Show why offerings were excluded →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {eligibleMatches.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-forest/10 pb-3">
                  <div>
                    <Link
                      href={`/donations/${m.donationId}`}
                      className="font-heading font-extrabold text-lg text-forest hover:text-natural transition-colors"
                    >
                      {m.donation?.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-forest/70 font-mono mt-1">
                      <span className="font-bold text-natural">{m.donation?.quantityKg} kg</span>
                      <span>·</span>
                      <span>{m.donation?.category}</span>
                      <span>·</span>
                      <span>{m.donation?.dietType}</span>
                      <span>·</span>
                      <span>By {m.donation?.donorBusinessName || 'Restaurant Donor'}</span>
                    </div>
                  </div>

                  <Link
                    href={`/donations/${m.donationId}`}
                    className="rounded-full bg-natural px-5 py-2 text-xs font-bold text-background hover:bg-natural/90 transition-colors shadow-sm"
                  >
                    View &amp; Claim →
                  </Link>
                </div>

                {/* Match Scoring Card */}
                <MatchCard match={m} showClaimButton={false} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Ineligible Donations with Rejection Reasons (FR-D4, Section 14.4) */}
      {includeIneligible && ineligibleMatches.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-forest/15">
          <h2 className="font-heading text-lg font-bold text-forest flex items-center gap-2">
            <XCircle className="w-5 h-5 text-amber-600" />
            Excluded Surplus Offerings &amp; Eligibility Explanations
          </h2>

          <div className="space-y-3">
            {ineligibleMatches.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest text-sm">
                    {m.donation?.title} ({m.donation?.quantityKg} kg)
                  </span>
                  <div className="flex gap-1">
                    {m.rejectionCodes.map((c) => (
                      <span
                        key={c}
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-amber-950 font-medium leading-relaxed">
                  Reason: {m.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
