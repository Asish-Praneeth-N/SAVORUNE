'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Scale,
  Building,
} from 'lucide-react';
import { Pickup } from '@/lib/types';
import { StatusChip, UrgencyBadge } from '@/components/status-chip';
import { CountdownTimer } from '@/components/countdown-timer';
import { CollectorPinInput } from '@/components/handoff-pin-card';
import { SafetyCard } from '@/components/safety-card';

export default function PickupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const fetchPickup = useCallback(async () => {
    try {
      const [resPickup, resMe] = await Promise.all([
        fetch(`/api/pickups`),
        fetch('/api/me'),
      ]);
      const jsonPickup = await resPickup.json();
      const jsonMe = await resMe.json();

      if (jsonPickup.data) {
        const found = jsonPickup.data.find((p: Pickup) => p.id === id);
        if (found) setPickup(found);
      }
      if (jsonMe.data) setCurrentUser(jsonMe.data.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPickup();
    const interval = setInterval(fetchPickup, 10000);
    return () => clearInterval(interval);
  }, [fetchPickup]);

  // Confirm Collection (with PIN)
  const handleConfirmCollected = async (enteredPin?: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pickups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COLLECTED',
          handoffPin: enteredPin,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Collection confirmation failed');
      }

      setSuccessMsg('Surplus successfully verified and collected! Proceed to delivery destination.');
      await fetchPickup();
    } catch (err: any) {
      setError(err.message || 'Collection verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delivery
  const handleConfirmDelivered = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pickups/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Delivery confirmation failed');
      }

      setSuccessMsg('Donation successfully delivered to receiver facility! Impact metrics updated.');
      await fetchPickup();
    } catch (err: any) {
      setError(err.message || 'Delivery confirmation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Volunteer Withdrawal (P1, FR-F11)
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pickups/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'WITHDRAW', reason: withdrawReason || 'Volunteer unable to complete' }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Withdrawal failed');
      }

      setShowWithdrawModal(false);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error withdrawing from assignment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 font-mono text-xs text-forest/60">
        Loading pickup tracking details...
      </div>
    );
  }

  if (!pickup) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="font-heading text-lg font-bold text-forest">Pickup Not Found</h2>
        <Link
          href="/pickups"
          className="inline-flex rounded-full bg-natural px-4 py-2 text-xs font-bold text-background"
        >
          View All Pickups
        </Link>
      </div>
    );
  }

  const isAccepted = pickup.status === 'ACCEPTED';
  const isCollected = pickup.status === 'COLLECTED';
  const isDelivered = pickup.status === 'DELIVERED';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-forest/15 pb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-natural hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <StatusChip status={pickup.status} />
          <UrgencyBadge urgency={pickup.donation?.urgency} />
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Info Card */}
      <div className="rounded-2xl border border-forest/15 bg-surface p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-forest/10 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-natural uppercase tracking-wider">
              Surplus Redistribution Task
            </span>
            <h1 className="font-heading text-2xl font-extrabold text-forest mt-0.5">
              {pickup.donation?.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-forest/70 font-mono mt-1">
              <span>{pickup.donation?.quantityKg} kg</span>
              <span>·</span>
              <span>{pickup.donation?.category}</span>
              <span>·</span>
              <span>{pickup.donation?.dietType}</span>
            </div>
          </div>

          {pickup.donation?.pickupDeadline && (
            <CountdownTimer deadlineIso={pickup.donation.pickupDeadline} />
          )}
        </div>

        {/* Route Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-background rounded-xl border border-forest/10 space-y-1">
            <span className="text-forest/60 font-semibold uppercase flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-natural" /> From: Donor Kitchen
            </span>
            <div className="font-bold text-forest text-sm">
              {pickup.donation?.donorBusinessName || 'Donor Restaurant'}
            </div>
            <div className="text-forest/70">
              Zone: {pickup.donation?.donorZoneCode || 'H1 (HITEC City)'}
            </div>
            {pickup.donation?.pickupInstructions && (
              <p className="text-[11px] text-forest/80 pt-1 font-sans">
                Instructions: &quot;{pickup.donation.pickupInstructions}&quot;
              </p>
            )}
          </div>

          <div className="p-4 bg-background rounded-xl border border-forest/10 space-y-1">
            <span className="text-forest/60 font-semibold uppercase flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-natural" /> To: Destination Facility
            </span>
            <div className="font-bold text-forest text-sm">
              {pickup.receiverName || 'Community Kitchen'}
            </div>
            <div className="text-forest/70">
              Collector: {pickup.collectorType === 'RECEIVER' ? 'Receiver Staff (Self-Collect)' : 'Volunteer Dispatch'}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BLOCK ACCORDING TO STATE */}
      {/* 1. Step: Confirm Collection (PIN or Self-Collect) */}
      {isAccepted && (
        <div className="rounded-2xl border-2 border-natural/40 bg-surface p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-forest/10 pb-3">
            <ShieldCheck className="w-5 h-5 text-natural" />
            <h2 className="font-heading text-lg font-bold text-forest">
              Confirm Food Collection at Donor Kitchen
            </h2>
          </div>

          {pickup.collectorType === 'RECEIVER' ? (
            <div className="space-y-3">
              <p className="text-xs text-forest/80 leading-relaxed">
                As the receiver representative, once you arrive at the donor kitchen and inspect the surplus portions, click below to confirm collection:
              </p>
              <button
                onClick={() => handleConfirmCollected()}
                disabled={actionLoading}
                className="w-full rounded-xl bg-natural py-3 text-sm font-bold text-background hover:bg-natural/90 transition-colors shadow-sm"
              >
                {actionLoading ? 'Confirming...' : 'Confirm Surplus Collected'}
              </button>
            </div>
          ) : (
            <div>
              <CollectorPinInput
                onSubmitPin={(pin) => handleConfirmCollected(pin)}
                loading={actionLoading}
                error={error}
              />
            </div>
          )}

          {/* Volunteer Withdraw Action (P1) */}
          {pickup.collectorType === 'VOLUNTEER' && (
            <div className="pt-3 border-t border-forest/10 text-center">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="text-xs text-forest/60 hover:text-rose-600 transition-colors underline font-medium"
              >
                I can no longer complete this pickup (Withdraw)
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Step: Confirm Delivery */}
      {isCollected && (
        <div className="rounded-2xl border-2 border-natural bg-natural/5 p-6 shadow-md space-y-4 text-center">
          <div className="w-12 h-12 bg-natural text-background rounded-full flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-xl font-bold text-forest">
            Food Is In Transit
          </h2>
          <p className="text-xs text-forest/80 max-w-md mx-auto">
            Once you arrive at <strong>{pickup.receiverName}</strong> and complete handover of the surplus food, confirm delivery below:
          </p>
          <button
            onClick={handleConfirmDelivered}
            disabled={actionLoading}
            className="rounded-full bg-natural px-8 py-3.5 text-sm font-bold text-background hover:bg-natural/90 transition-all shadow-md"
          >
            {actionLoading ? 'Recording Delivery...' : 'Confirm Safe Delivery Handover →'}
          </button>
        </div>
      )}

      {/* 3. Step: Completed / Delivered */}
      {isDelivered && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 shadow-sm text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="font-heading text-xl font-bold text-emerald-950">
            Delivery Complete &amp; Verified!
          </h2>
          <p className="text-xs text-emerald-900 max-w-md mx-auto">
            This food surplus was successfully delivered to {pickup.receiverName}. The platform impact dashboard has recorded {pickup.donation?.quantityKg} kg rescued!
          </p>
          <div className="pt-2">
            <Link
              href="/impact"
              className="inline-flex rounded-full bg-natural px-6 py-2.5 text-xs font-bold text-background hover:bg-natural/90"
            >
              View Updated Impact Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* Safety Card */}
      {pickup.donation && (
        <SafetyCard
          storageCondition={pickup.donation.storageCondition}
          allergenStatus={pickup.donation.allergenStatus}
          allergens={pickup.donation.allergens}
          preparedAt={pickup.donation.preparedAt}
          pickupDeadline={pickup.donation.pickupDeadline}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-forest/15 space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest">
              Withdraw from Pickup
            </h3>
            <p className="text-xs text-forest/70">
              The pickup will return to the open volunteer board for reassignment, and the handoff PIN will be rotated for security.
            </p>
            <textarea
              required
              rows={2}
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              placeholder="e.g. Vehicle flat tire or emergency"
              className="w-full text-xs p-3 rounded-xl border border-forest/20 bg-background text-forest focus:outline-none focus:ring-2 focus:ring-natural"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 text-xs font-semibold text-forest/70 hover:text-forest"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleWithdraw}
                className="px-4 py-2 text-xs font-bold rounded-full bg-rose-600 text-white hover:bg-rose-700"
              >
                {actionLoading ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
