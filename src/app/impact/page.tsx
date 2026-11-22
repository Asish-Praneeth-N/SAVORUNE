'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  Building,
  HelpCircle,
} from 'lucide-react';
import { DISCLAIMER_TEXT } from '@/lib/constants';

export default function ImpactDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'platform' | 'me'>('platform');
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/impact?scope=${scope}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setMetrics(json.data);
      })
      .finally(() => setLoading(false));
  }, [scope]);

  return (
    <div className="space-y-8">
      {/* 1. Header (FR-G1) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest flex items-center gap-2">
            <Award className="w-6 h-6 text-natural" />
            Redistribution Impact Dashboard
          </h1>
          <p className="text-xs text-forest/70 mt-1">
            Calculated strictly from verified DELIVERED donations (PRD Section 20).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-surface border border-forest/20 p-1 text-xs font-semibold">
            <button
              onClick={() => setScope('platform')}
              className={`px-3 py-1 rounded-full transition-colors ${
                scope === 'platform' ? 'bg-forest text-background' : 'text-forest/70'
              }`}
            >
              Platform-Wide
            </button>
            <button
              onClick={() => setScope('me')}
              className={`px-3 py-1 rounded-full transition-colors ${
                scope === 'me' ? 'bg-natural text-background' : 'text-forest/70'
              }`}
            >
              My Contributions
            </button>
          </div>

          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border border-natural/40 bg-natural/5 text-natural hover:bg-natural/10"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Methodology
          </button>
        </div>
      </div>

      {/* 2. "How we calculate this" Methodology Panel (FR-G6, Section 20) */}
      {showMethodology && metrics && (
        <div className="rounded-2xl border-2 border-natural/40 bg-surface p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-forest/10 pb-3">
            <h2 className="font-heading text-base font-bold text-forest flex items-center gap-2">
              <Info className="w-5 h-5 text-natural" />
              How We Calculate This (PRD Section 20)
            </h2>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
              Synthetic Demo Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3.5 bg-background rounded-xl border border-forest/10">
              <strong className="text-forest uppercase tracking-wider font-mono">
                1. Delivered Donations Only (BL-08)
              </strong>
              <p className="text-forest/80 leading-relaxed">
                POSTED, CLAIMED, COLLECTED, EXPIRED, and CANCELLED donations are never counted as impact. Only donations verified as DELIVERED by the collector/receiver enter impact queries.
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-background rounded-xl border border-forest/10">
              <strong className="text-forest uppercase tracking-wider font-mono">
                2. Recorded vs. Estimate Separation
              </strong>
              <p className="text-forest/80 leading-relaxed">
                Food weight delivered (kg) and delivered count are donor-declared recorded quantities. Meals saved and waste avoided are mathematical estimates derived from explicit assumptions.
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-background rounded-xl border border-forest/10">
              <strong className="text-forest uppercase tracking-wider font-mono">
                3. Meals Saved Formula
              </strong>
              <p className="text-forest/80 leading-relaxed font-mono">
                (Food Weight in kg × 1000) ÷ {metrics.assumptions.gramsPerMeal} g per meal portion. (Configurable in settings; default: 400 g).
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-background rounded-xl border border-forest/10">
              <strong className="text-forest uppercase tracking-wider font-mono">
                4. Food Waste Avoided Assumption
              </strong>
              <p className="text-forest/80 leading-relaxed">
                {metrics.assumptions.wasteAvoidedBasis}
              </p>
            </div>
          </div>

          <p className="text-xs text-forest/70 italic border-t border-forest/10 pt-3">
            &quot;These are estimates based on recorded donations and stated assumptions; they are not verified environmental measurements.&quot;
          </p>
        </div>
      )}

      {/* 3. Core KPI Grid (FR-G1) */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Delivered Count */}
          <div className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Delivered Surplus
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {metrics.labels.deliveredCount}
              </span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-forest">
              {metrics.totals.deliveredCount}
            </div>
            <span className="text-[11px] text-forest/60 font-semibold">
              Successfully completed donations
            </span>
          </div>

          {/* Weight Rescued */}
          <div className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Food Weight Rescued
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {metrics.labels.kgRescued}
              </span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-forest">
              {metrics.totals.kgRescued.toFixed(0)} <span className="text-lg font-normal">kg</span>
            </div>
            <span className="text-[11px] text-forest/60 font-semibold">
              Donor-declared surplus weight
            </span>
          </div>

          {/* Meals Saved */}
          <div className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Estimated Meals Saved
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                {metrics.labels.mealsSaved}
              </span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-natural">
              {metrics.totals.mealsSaved}
            </div>
            <span className="text-[11px] text-forest/60 font-semibold font-mono">
              Basis: {metrics.assumptions.gramsPerMeal}g / meal
            </span>
          </div>

          {/* Waste Avoided */}
          <div className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Food Waste Avoided
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                {metrics.labels.wasteAvoidedKg}
              </span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-forest">
              {metrics.totals.wasteAvoidedKg.toFixed(0)} <span className="text-lg font-normal">kg</span>
            </div>
            <span className="text-[11px] text-forest/60 font-semibold">
              Avoided kitchen landfill
            </span>
          </div>
        </div>
      )}

      {/* 4. Donor Contribution Rankings (FR-G2) */}
      {metrics && metrics.donorRanking && (
        <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-forest/10 pb-3">
            <h2 className="font-heading text-lg font-bold text-forest flex items-center gap-2">
              <Building className="w-5 h-5 text-natural" />
              Donor Contribution Ranking (By Delivered Weight)
            </h2>
            <span className="text-xs text-forest/60 font-mono">
              Recorded DELIVERED kilograms
            </span>
          </div>

          {metrics.donorRanking.length === 0 ? (
            <p className="text-xs text-forest/60 italic py-4">
              No delivered donations recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {metrics.donorRanking.map((donor: any, i: number) => (
                <div
                  key={donor.donorId}
                  className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-forest/10 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-natural/15 text-natural font-mono font-bold flex items-center justify-center text-xs">
                      #{i + 1}
                    </span>
                    <span className="font-bold text-forest text-sm">
                      {donor.businessName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-forest/70">{donor.deliveredCount} donations</span>
                    <strong className="text-forest font-bold text-sm bg-surface px-2.5 py-1 rounded border border-forest/15">
                      {donor.deliveredKg} kg rescued
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Daily Completion Trend (FR-G3) */}
      {metrics && metrics.trend && (
        <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-forest/10 pb-3">
            <h2 className="font-heading text-lg font-bold text-forest flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-natural" />
              Delivery Activity Trend
            </h2>
            <span className="text-xs text-forest/60 font-mono">Daily volume</span>
          </div>

          <div className="space-y-2">
            {metrics.trend.map((item: any) => (
              <div
                key={item.date}
                className="flex items-center justify-between p-3 bg-background rounded-xl border border-forest/10 text-xs font-mono"
              >
                <span className="font-bold text-forest">{item.date}</span>
                <div className="flex items-center gap-4">
                  <span className="text-natural font-bold">{item.kg} kg</span>
                  <span className="text-forest/70">~{item.meals} meals</span>
                  <span className="text-forest/50">({item.donations} donations)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer Card */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 italic">
        {DISCLAIMER_TEXT}
      </div>
    </div>
  );
}
