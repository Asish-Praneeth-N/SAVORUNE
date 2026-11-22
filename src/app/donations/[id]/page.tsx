'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Scale,
  MapPin,
  AlertTriangle,
  XCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { Donation, StatusHistory, Pickup, Claim } from '@/lib/types';
import { StatusChip, UrgencyBadge } from '@/components/status-chip';
import { CountdownTimer } from '@/components/countdown-timer';
import { SafetyCard } from '@/components/safety-card';
import { StatusStepper } from '@/components/status-stepper';
import { DonorHandoffPinDisplay } from '@/components/handoff-pin-card';

export default function DonationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<{
    donation: Donation;
    history: StatusHistory[];
    activeClaim?: Claim;
    activePickup?: Pickup;
    handoffPin?: string | null;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const [resDetail, resMe] = await Promise.all([
        fetch(`/api/donations/${id}`),
        fetch('/api/me'),
      ]);
      const jsonDetail = await resDetail.json();
      const jsonMe = await resMe.json();

      if (jsonDetail.data) setData(jsonDetail.data);
      if (jsonMe.data) setCurrentUser(jsonMe.data.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
    // 10-second polling for live status updates (PRD Assumption A5)
    const interval = setInterval(fetchDetail, 10000);
    return () => clearInterval(interval);
  }, [fetchDetail]);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL', reason: cancelReason }),
      });
      if (res.ok) {
        setShowCancelModal(false);
        fetchDetail();
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 font-mono text-xs text-forest/60">
        Loading donation record...
      </div>
    );
  }

  if (!data?.donation) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="font-heading text-lg font-bold text-forest">Donation Not Found</h2>
        <p className="text-xs text-forest/70">
          This donation may have been removed or is outside your authorization scope.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full bg-natural px-4 py-2 text-xs font-bold text-background"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const { donation, history, activeClaim, activePickup, handoffPin } = data;
  const isDonorOrAdmin = currentUser?.role === 'DONOR' || currentUser?.role === 'ADMIN';
  const isReceiver = currentUser?.role === 'RECEIVER';
  const isVolunteer = currentUser?.role === 'VOLUNTEER';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between border-b border-forest/15 pb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-natural hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <StatusChip status={donation.status} />
          <UrgencyBadge urgency={donation.urgency} />
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-forest">
            {donation.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-forest/70 font-mono">
            <span>Posted by {donation.donorBusinessName || 'Donor'}</span>
            <span>·</span>
            <span>Zone {donation.donorZoneCode || 'H1'}</span>
            <span>·</span>
            <span>Ref: {donation.id}</span>
          </div>
        </div>

        {/* Claim / Action CTA */}
        {donation.status === 'POSTED' && isReceiver && (
          <Link
            href={`/donations/${donation.id}/claim`}
            className="rounded-full bg-natural px-6 py-2.5 text-xs font-bold text-background hover:bg-natural/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            Claim Surplus Food →
          </Link>
        )}

        {/* Cancel Action (FR-C6) */}
        {(donation.status === 'POSTED' || donation.status === 'CLAIMED') && isDonorOrAdmin && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 text-xs font-semibold transition-colors"
          >
            Cancel Offering
          </button>
        )}
      </div>

      {/* Lifecycle Progress Stepper (FR-F1, Section 15) */}
      <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm">
        <StatusStepper status={donation.status} history={history} />
      </div>

      {/* Handoff PIN Card (FR-F10: Owner / Admin only while pickup open) */}
      {handoffPin && (
        <DonorHandoffPinDisplay pin={handoffPin} />
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity & Logistics Block */}
        <div className="rounded-2xl border border-forest/15 bg-surface p-6 space-y-4 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-forest border-b border-forest/10 pb-2 flex items-center gap-2">
            <Scale className="w-5 h-5 text-natural" />
            Portion &amp; Logistics
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-background rounded-xl border border-forest/10">
              <span className="text-forest/60">Surplus Quantity</span>
              <div className="font-bold text-forest text-lg mt-0.5">
                {donation.quantityKg} kg
              </div>
            </div>

            <div className="p-3 bg-background rounded-xl border border-forest/10">
              <span className="text-forest/60">Estimated Portions</span>
              <div className="font-bold text-forest text-lg mt-0.5">
                ~{donation.estimatedServings} meals
              </div>
            </div>

            <div className="p-3 bg-background rounded-xl border border-forest/10">
              <span className="text-forest/60">Category</span>
              <div className="font-bold text-forest text-sm mt-0.5">
                {donation.category.replace('_', ' ')}
              </div>
            </div>

            <div className="p-3 bg-background rounded-xl border border-forest/10">
              <span className="text-forest/60">Dietary Policy</span>
              <div className="font-bold text-forest text-sm mt-0.5">
                {donation.dietType}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-forest/10">
            <CountdownTimer deadlineIso={donation.pickupDeadline} />
          </div>

          {/* Pickup Instructions (Revealed under BL-10) */}
          <div className="pt-2 border-t border-forest/10 space-y-1">
            <span className="text-xs font-bold text-forest uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-natural" />
              Pickup Instructions &amp; Location
            </span>
            {donation.pickupInstructions ? (
              <p className="text-xs text-forest/80 bg-background p-3 rounded-xl border border-forest/10 leading-relaxed">
                {donation.pickupInstructions}
              </p>
            ) : (
              <p className="text-xs text-forest/50 italic">
                Exact instructions are revealed upon confirmed claim.
              </p>
            )}
          </div>
        </div>

        {/* Safety & Handling Card (FR-H1, Section 21) */}
        <div>
          <SafetyCard
            storageCondition={donation.storageCondition}
            allergenStatus={donation.allergenStatus}
            allergens={donation.allergens}
            preparedAt={donation.preparedAt}
            pickupDeadline={donation.pickupDeadline}
          />
        </div>
      </div>

      {/* Active Pickup Coordination Status */}
      {activePickup && (
        <div className="rounded-2xl border border-natural/20 bg-natural/5 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-natural flex items-center gap-2">
              <Truck className="w-5 h-5 text-natural" />
              Pickup Coordination Live Progress
            </h2>
            <span className="text-xs font-mono font-bold uppercase bg-natural/15 text-natural px-3 py-1 rounded-full">
              Status: {activePickup.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-surface p-3 rounded-lg border border-natural/20">
              <span className="text-forest/60">Collector Method:</span>
              <div className="font-bold text-forest">
                {activePickup.collectorType === 'RECEIVER' ? 'Receiver Self-Collect' : 'Volunteer Dispatch'}
              </div>
            </div>

            <div className="bg-surface p-3 rounded-lg border border-natural/20">
              <span className="text-forest/60">Claimant Organization:</span>
              <div className="font-bold text-forest">{activePickup.receiverName || 'Verified Receiver'}</div>
            </div>

            <div className="bg-surface p-3 rounded-lg border border-natural/20">
              <span className="text-forest/60">Assigned Volunteer:</span>
              <div className="font-bold text-forest">
                {activePickup.volunteerName || (activePickup.collectorType === 'RECEIVER' ? 'Staff Rep' : 'Open for acceptance')}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/pickups/${activePickup.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-natural hover:underline"
            >
              Open Full Pickup Tracker &amp; Confirmation Screen →
            </Link>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-forest/15 space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest">
              Confirm Donation Cancellation
            </h3>
            <p className="text-xs text-forest/70">
              Cancelling will close any active claims and notify the receiver network. Please state a reason:
            </p>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Kitchen operational emergency or food depleted"
              className="w-full text-xs p-3 rounded-xl border border-forest/20 bg-background text-forest focus:outline-none focus:ring-2 focus:ring-natural"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-forest/70 hover:text-forest"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={cancelling || !cancelReason.trim()}
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-bold rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
