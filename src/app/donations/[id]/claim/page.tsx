'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { SafetyCard } from '@/components/safety-card';

export default function ClaimDonationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [donation, setDonation] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/donations/${id}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || 'Could not load this donation.');
        setDonation(body.data?.donation || body.data);
      })
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function claim() {
    if (!acknowledged) return;
    setSubmitting(true); setError('');
    try {
      const response = await fetch(`/api/donations/${id}/claim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ safetyAck: true }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'Could not claim this donation.');
      router.replace(`/pickups/${body.data.pickup.id}`); router.refresh();
    } catch (cause: any) { setError(cause.message); setSubmitting(false); }
  }

  if (loading) return <div className="panel mx-auto flex max-w-3xl items-center justify-center gap-3 p-12"><Loader2 className="size-5 animate-spin" /> Loading claim details…</div>;
  if (!donation) return <div className="panel mx-auto max-w-3xl p-8"><p className="font-bold text-red-700">{error || 'Donation not found.'}</p><Link href="/recommendations" className="btn-secondary mt-5">Back to recommendations</Link></div>;

  return <div className="mx-auto max-w-3xl space-y-6">
    <div><p className="eyebrow">Review before claiming</p><h1 className="mt-2 text-3xl font-extrabold">{donation.title}</h1><p className="mt-2 text-forest/60">{donation.quantityKg} kg · Collection deadline {new Date(donation.pickupDeadline).toLocaleString()}</p></div>
    <SafetyCard storageCondition={donation.storageCondition} allergenStatus={donation.allergenStatus} allergens={donation.allergens} preparedAt={donation.preparedAt} pickupDeadline={donation.pickupDeadline} />
    <div className="panel p-6"><label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 size-5 shrink-0 accent-green-700" /><span><strong className="block text-forest">I reviewed the handling and allergen information.</strong>I understand that SAVORUNE coordinates the rescue and does not certify food safety.</span></label>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href={`/donations/${id}`} className="btn-secondary">Cancel</Link><button type="button" disabled={!acknowledged || submitting} onClick={claim} className="btn-primary">{submitting ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}{submitting ? 'Claiming…' : 'Confirm claim'}</button></div>
    </div>
  </div>;
}
