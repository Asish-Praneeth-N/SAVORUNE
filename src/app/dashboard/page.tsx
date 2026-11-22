'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  Scale,
  Award,
  Store,
  Utensils,
  Truck,
  Shield,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Check,
} from 'lucide-react';
import { Donation, Pickup } from '@/lib/types';
import { StatusChip, UrgencyBadge } from '@/components/status-chip';
import { CountdownTimer } from '@/components/countdown-timer';
import { CapacityMeter } from '@/components/capacity-meter';

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeRoleTab, setActiveRoleTab] = useState<'DONOR' | 'RECEIVER' | 'VOLUNTEER' | 'ADMIN'>('DONOR');
  const [loading, setLoading] = useState(true);

  // Data states
  const [donations, setDonations] = useState<Donation[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);

  // Sub-filter for donor
  const [donorStatusTab, setDonorStatusTab] = useState<'ACTIVE' | 'CLAIMED' | 'COMPLETED' | 'EXPIRED'>('ACTIVE');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch current user identity & role
      const resMe = await fetch('/api/me');
      const dataMe = await resMe.json();
      if (dataMe.data?.user) {
        setCurrentUser(dataMe.data.user);
        if (dataMe.data.user.role) {
          setActiveRoleTab(dataMe.data.user.role);
        }
      }

      // 2. Fetch donations & impact
      const [resDonations, resImpact, resPickups] = await Promise.all([
        fetch('/api/donations?sort=deadline'),
        fetch('/api/impact?scope=me'),
        fetch('/api/pickups?status=OPEN'),
      ]);

      const dataDonations = await resDonations.json();
      const dataImpact = await resImpact.json();
      const dataPickups = await resPickups.json();

      if (dataDonations.data) setDonations(dataDonations.data);
      if (dataImpact.data) setImpact(dataImpact.data);
      if (dataPickups.data) setPickups(dataPickups.data);

      // 3. Fetch smart matches if receiver
      const resMatches = await fetch('/api/matches');
      const dataMatches = await resMatches.json();
      if (dataMatches.data) setMatches(dataMatches.data.matches || []);

      // 4. Fetch admin analytics
      const resAdmin = await fetch('/api/admin/analytics');
      const dataAdmin = await resAdmin.json();
      if (dataAdmin.data) setAdminAnalytics(dataAdmin.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Donor lists
  const activeDonations = donations.filter((d) => d.status === 'POSTED');
  const claimedDonations = donations.filter((d) => d.status === 'CLAIMED' || d.status === 'COLLECTED');
  const completedDonations = donations.filter((d) => d.status === 'DELIVERED');
  const expiredDonations = donations.filter((d) => d.status === 'EXPIRED' || d.status === 'CANCELLED');

  let donorCurrentList = activeDonations;
  if (donorStatusTab === 'CLAIMED') donorCurrentList = claimedDonations;
  if (donorStatusTab === 'COMPLETED') donorCurrentList = completedDonations;
  if (donorStatusTab === 'EXPIRED') donorCurrentList = expiredDonations;

  return (
    <div className="space-y-8 py-2">
      {/* 1. Header & Role Mode Tabs */}
      <div className="panel flex flex-col justify-between gap-6 overflow-hidden bg-forest p-6 text-white sm:p-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-extrabold text-white sm:text-4xl">
              Your rescue workspace
            </h1>
            {currentUser && (
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
                {currentUser.displayName} · {currentUser.role}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
            Real-time surplus food rescue, smart matching, and verified handoffs.
          </p>
        </div>

        {/* Role Hub Switcher */}
        <div className="hidden">
          <button
            onClick={() => setActiveRoleTab('DONOR')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === 'DONOR'
                ? 'bg-natural text-background shadow'
                : 'text-forest/70 hover:text-forest hover:bg-forest/5'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Donor Hub</span>
          </button>

          <button
            onClick={() => setActiveRoleTab('RECEIVER')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === 'RECEIVER'
                ? 'bg-natural text-background shadow'
                : 'text-forest/70 hover:text-forest hover:bg-forest/5'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Receiver Hub</span>
          </button>

          <button
            onClick={() => setActiveRoleTab('VOLUNTEER')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === 'VOLUNTEER'
                ? 'bg-natural text-background shadow'
                : 'text-forest/70 hover:text-forest hover:bg-forest/5'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Volunteer Hub</span>
          </button>

          <button
            onClick={() => setActiveRoleTab('ADMIN')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === 'ADMIN'
                ? 'bg-orange text-forest shadow'
                : 'text-forest/70 hover:text-forest hover:bg-forest/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* 2. TAB: DONOR HUB */}
      {activeRoleTab === 'DONOR' && (
        <div className="space-y-6">
          {/* Quick Actions & Impact Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 rounded-2xl bg-gradient-to-br from-natural to-forest text-background p-5 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-lime/90 font-bold">
                  Surplus Dispatch
                </span>
                <h3 className="font-heading font-extrabold text-xl text-background mt-1">
                  Have Excess Food?
                </h3>
                <p className="text-xs text-background/80 mt-1">
                  Post in under 60s with smart portions, allergen tags, and safety checklists.
                </p>
              </div>
              <Link
                href="/donations/new"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-lime text-forest font-bold px-4 py-2.5 text-xs hover:bg-lime/90 shadow transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Post Surplus (&lt;60s)
              </Link>
            </div>

            <div className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest/60">
                Active Surplus Items
              </span>
              <div className="font-mono text-3xl font-extrabold text-natural my-2">
                {activeDonations.length}
              </div>
              <p className="text-[11px] text-forest/70">
                Awaiting claims by local community kitchens and shelters.
              </p>
            </div>

            <div className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest/60">
                Delivered Rescues
              </span>
              <div className="font-mono text-3xl font-extrabold text-forest my-2">
                {completedDonations.length}
              </div>
              <p className="text-[11px] text-forest/70">
                Successfully handed off and verified with 6-digit PIN.
              </p>
            </div>
          </div>

          {/* Donor Tab Filter */}
          <div className="flex border-b border-forest/15 gap-4 text-xs font-bold">
            <button
              onClick={() => setDonorStatusTab('ACTIVE')}
              className={`pb-2.5 border-b-2 transition-colors ${
                donorStatusTab === 'ACTIVE'
                  ? 'border-natural text-natural'
                  : 'border-transparent text-forest/60 hover:text-forest'
              }`}
            >
              Active ({activeDonations.length})
            </button>
            <button
              onClick={() => setDonorStatusTab('CLAIMED')}
              className={`pb-2.5 border-b-2 transition-colors ${
                donorStatusTab === 'CLAIMED'
                  ? 'border-natural text-natural'
                  : 'border-transparent text-forest/60 hover:text-forest'
              }`}
            >
              In Transit ({claimedDonations.length})
            </button>
            <button
              onClick={() => setDonorStatusTab('COMPLETED')}
              className={`pb-2.5 border-b-2 transition-colors ${
                donorStatusTab === 'COMPLETED'
                  ? 'border-natural text-natural'
                  : 'border-transparent text-forest/60 hover:text-forest'
              }`}
            >
              Completed ({completedDonations.length})
            </button>
            <button
              onClick={() => setDonorStatusTab('EXPIRED')}
              className={`pb-2.5 border-b-2 transition-colors ${
                donorStatusTab === 'EXPIRED'
                  ? 'border-natural text-natural'
                  : 'border-transparent text-forest/60 hover:text-forest'
              }`}
            >
              Expired / Cancelled ({expiredDonations.length})
            </button>
          </div>

          {/* Donation Cards */}
          {donorCurrentList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-forest/20 p-12 text-center space-y-3">
              <Store className="w-10 h-10 text-forest/30 mx-auto" />
              <p className="font-heading font-bold text-forest text-sm">
                No donations in this category
              </p>
              <p className="text-xs text-forest/60 max-w-sm mx-auto">
                Ready to rescue surplus food? Post a portion in under 60 seconds.
              </p>
              <Link
                href="/donations/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-natural px-4 py-2 text-xs font-bold text-background hover:bg-natural/90"
              >
                <PlusCircle className="w-3.5 h-3.5 text-lime" />
                Post Surplus
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {donorCurrentList.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl border border-forest/15 bg-surface p-5 shadow-sm space-y-3 hover:border-forest/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <StatusChip status={d.status} />
                      <UrgencyBadge deadline={d.pickupDeadline} />
                    </div>

                    <h3 className="font-heading font-bold text-base text-forest">
                      {d.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-forest/70 font-mono">
                      <span>{d.quantityKg} kg (~{d.estimatedServings} servings)</span>
                      <span>·</span>
                      <span>{d.category.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{d.storageCondition}</span>
                    </div>

                    <CountdownTimer deadlineIso={d.pickupDeadline} />
                  </div>

                  <div className="pt-2 border-t border-forest/10 flex items-center justify-between">
                    <span className="text-[11px] text-forest/60 font-mono">
                      ID: {d.id}
                    </span>
                    <Link
                      href={`/donations/${d.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-natural hover:underline"
                    >
                      <span>Manage & Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: RECEIVER HUB */}
      {activeRoleTab === 'RECEIVER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-lg text-forest flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-lime" />
                  Deterministic Smart Matches
                </h3>
                <Link
                  href="/recommendations"
                  className="text-xs font-bold text-natural hover:underline flex items-center gap-1"
                >
                  View Full Ranking Engine <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-forest/70 leading-relaxed">
                Ranked with pure transparent scoring: <strong>Distance (30%) + Quantity (25%) + Timing (25%) + Need (20%)</strong>. Hard eligibility filters guarantee zero capacity overages or expired pickups.
              </p>

              {matches.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-forest/20 rounded-xl space-y-2">
                  <Utensils className="w-8 h-8 text-forest/30 mx-auto" />
                  <p className="text-xs font-bold text-forest">No surplus matching currently available</p>
                  <p className="text-[11px] text-forest/60">
                    Matches update automatically when new surplus is posted in your service zone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {matches.slice(0, 3).map((m: any) => (
                    <div
                      key={m.donation.id}
                      className="p-3.5 rounded-xl border border-forest/10 hover:border-natural bg-background/50 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-forest">
                            {m.donation.title}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-natural/10 text-natural font-mono font-bold">
                            Score: {m.finalScore}/100
                          </span>
                        </div>
                        <p className="text-xs text-forest/70">
                          {m.donation.quantityKg} kg ({m.donation.category}) · {m.distanceKm} km away
                        </p>
                      </div>

                      <Link
                        href={`/donations/${m.donation.id}`}
                        className="rounded-full bg-lime px-3 py-1.5 text-xs font-bold text-forest hover:bg-lime/90 shadow-sm"
                      >
                        Claim Surplus
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Capacity Panel */}
            <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-base text-forest">
                Daily Capacity Limit
              </h3>
              <p className="text-xs text-forest/70">
                To prevent over-commitment, receivers cannot claim surplus exceeding their declared daily handling capacity.
              </p>
              <CapacityMeter dailyCapacityKg={60} committedTodayKg={15} remainingCapacityKg={45} />
              <div className="pt-2 border-t border-forest/10 text-[11px] text-forest/60 font-mono">
                Verified Zone: H2 · Madhapur Central
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: VOLUNTEER HUB */}
      {activeRoleTab === 'VOLUNTEER' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-forest flex items-center gap-2">
                  <Truck className="w-5 h-5 text-natural" />
                  Available Surplus Rescues
                </h3>
                <p className="text-xs text-forest/70 mt-0.5">
                  Claim an open transport leg and coordinate handoff with 6-digit PIN verification.
                </p>
              </div>
              <Link
                href="/pickups"
                className="text-xs font-bold text-natural hover:underline flex items-center gap-1"
              >
                All Open Pickups <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pickups.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-forest/20 rounded-xl space-y-2">
                <Truck className="w-8 h-8 text-forest/30 mx-auto" />
                <p className="text-xs font-bold text-forest">No open pickups currently awaiting volunteers</p>
                <p className="text-[11px] text-forest/60">
                  When a receiver chooses &quot;Open to Volunteer Drivers&quot;, deliveries will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pickups.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-forest/15 bg-background space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-forest font-heading">
                        Pickup #{p.id.slice(-6)}
                      </span>
                      <StatusChip status={p.status} />
                    </div>
                    <div className="text-xs text-forest/80 space-y-1 font-mono">
                      <div>Created: {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div>Attempts: {p.handoffPinAttempts} / 3</div>
                    </div>
                    <Link
                      href={`/pickups/${p.id}`}
                      className="block w-full text-center rounded-full bg-natural px-3 py-1.5 text-xs font-bold text-background hover:bg-natural/90"
                    >
                      Coordinate Handoff
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB: ADMIN HUB */}
      {activeRoleTab === 'ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="rounded-2xl border border-forest/15 bg-surface p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Total Posted
              </span>
              <div className="font-mono text-3xl font-extrabold text-forest mt-1">
                {donations.length}
              </div>
            </div>
            <div className="rounded-2xl border border-forest/15 bg-surface p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Active Pickups
              </span>
              <div className="font-mono text-3xl font-extrabold text-forest mt-1">
                {claimedDonations.length}
              </div>
            </div>
            <div className="rounded-2xl border border-forest/15 bg-surface p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-natural">
                Delivered
              </span>
              <div className="font-mono text-3xl font-extrabold text-forest mt-1">
                {completedDonations.length}
              </div>
            </div>
            <div className="rounded-2xl border border-forest/15 bg-surface p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange">
                Stuck Monitor
              </span>
              <div className="font-mono text-3xl font-extrabold text-forest mt-1">
                {adminAnalytics?.stuckPickups?.length || 0}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-forest flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange" />
              Real-time Stuck Pickup Monitor (&lt;30m to Deadline)
            </h3>
            <p className="text-xs text-forest/70">
              Pickups marked CLAIMED with less than 30 minutes before the donor pickup deadline trigger automated coordinator alerts to prevent food expiration.
            </p>
            {(!adminAnalytics?.stuckPickups || adminAnalytics.stuckPickups.length === 0) ? (
              <div className="p-4 rounded-xl bg-natural/10 border border-natural/20 text-natural text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                All active pickups are well within safe collection windows.
              </div>
            ) : (
              <div className="space-y-2">
                {adminAnalytics.stuckPickups.map((sp: any) => (
                  <div
                    key={sp.pickupId}
                    className="p-3 rounded-xl bg-orange/10 border border-orange/30 text-xs flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-forest">Pickup #{sp.pickupId}</strong> · {sp.donationTitle}
                    </div>
                    <span className="font-mono font-bold text-orange">
                      {sp.minutesRemaining} min remaining
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
