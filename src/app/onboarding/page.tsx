'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Building2, HeartHandshake, Store, MapPin, Check, Loader2 } from 'lucide-react';
import { SYNTHETIC_ZONES } from '@/lib/constants';
import type { UserRole } from '@/lib/types';

const ZoneMap = dynamic(() => import('@/components/zone-map').then((module) => module.ZoneMap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-[14px] border border-forest/10 bg-forest/[.04]" aria-label="Loading service-zone map" />,
});

const roles = [
  { value: 'DONOR' as UserRole, title: 'Food donor', text: 'Post restaurant surplus and coordinate handoffs.', icon: Store },
  { value: 'RECEIVER' as UserRole, title: 'Receiver', text: 'Claim suitable food for a kitchen, NGO, or shelter.', icon: Building2 },
  { value: 'VOLUNTEER' as UserRole, title: 'Volunteer', text: 'Collect and deliver open rescue assignments.', icon: HeartHandshake },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('DONOR');
  const [displayName, setDisplayName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [zoneCode, setZoneCode] = useState('H1');
  const [dailyCapacityKg, setDailyCapacityKg] = useState(40);
  const [receiverType, setReceiverType] = useState('NGO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (!displayName.trim()) throw new Error('Enter your display name.');
      if (role !== 'VOLUNTEER' && !organizationName.trim()) throw new Error('Enter your organization name.');
      const response = await fetch('/api/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ onboard: true, role, displayName, organizationName, zoneCode, dailyCapacityKg, receiverType }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || 'Could not complete setup.');
      router.replace('/dashboard'); router.refresh();
    } catch (err: any) { setError(err.message || 'Could not complete setup.'); } finally { setLoading(false); }
  }

  return <div className="mx-auto max-w-4xl py-4 sm:py-10">
    <div className="mb-9 text-center"><p className="eyebrow">One final step</p><h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">How will you rescue food?</h1><p className="mx-auto mt-4 max-w-xl text-base leading-7 text-forest/60">Your role controls what you can see and do. Administrator access is never available through self-service onboarding.</p></div>
    <form onSubmit={submit} className="panel overflow-hidden">
      <div className="border-b border-forest/10 p-5 sm:p-8"><p className="text-sm font-extrabold">Choose your role</p><div className="mt-4 grid gap-3 md:grid-cols-3">{roles.map(({ value, title, text, icon: Icon }) => <button key={value} type="button" onClick={() => setRole(value)} className={`relative min-h-36 rounded-2xl border p-5 text-left transition ${role === value ? 'border-natural bg-natural/[.06] ring-2 ring-natural/15' : 'border-forest/10 bg-white hover:border-natural/30'}`}><span className={`grid size-11 place-items-center rounded-xl ${role === value ? 'bg-natural text-white' : 'bg-forest/5 text-forest'}`}><Icon className="size-5" /></span><span className="mt-4 block text-base font-extrabold">{title}</span><span className="mt-1 block text-sm leading-5 text-forest/55">{text}</span>{role === value && <Check className="absolute right-4 top-4 size-5 text-natural" />}</button>)}</div></div>
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-8">
        <label className="grid gap-2 text-sm font-bold">Your name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl border px-4" placeholder="e.g. Ravi Kumar" required /></label>
        {role !== 'VOLUNTEER' && <label className="grid gap-2 text-sm font-bold">Organization name<input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="rounded-xl border px-4" placeholder={role === 'DONOR' ? 'Restaurant name' : 'NGO, kitchen, or shelter'} required /></label>}
        <label className="grid gap-2 text-sm font-bold"><span className="flex items-center gap-2"><MapPin className="size-4 text-natural" /> Synthetic service zone</span><select value={zoneCode} onChange={(e) => setZoneCode(e.target.value)} className="rounded-xl border px-4">{SYNTHETIC_ZONES.map((zone) => <option key={zone.code} value={zone.code}>{zone.name}</option>)}</select></label>
        {role === 'RECEIVER' && <><label className="grid gap-2 text-sm font-bold">Organization type<select value={receiverType} onChange={(e) => setReceiverType(e.target.value)} className="rounded-xl border px-4"><option value="NGO">NGO</option><option value="COMMUNITY_KITCHEN">Community kitchen</option><option value="SHELTER">Shelter</option></select></label><label className="grid gap-2 text-sm font-bold">Daily capacity (kg)<input type="number" min="1" max="500" value={dailyCapacityKg} onChange={(e) => setDailyCapacityKg(Number(e.target.value))} className="rounded-xl border px-4" /></label></>}
        <div className="sm:col-span-2"><ZoneMap zoneCode={zoneCode} /></div>
      </div>
      {error && <p role="alert" className="mx-5 mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:mx-8">{error}</p>}
      <div className="flex flex-col gap-3 border-t border-forest/10 bg-background/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8"><p className="text-sm text-forest/55">You can request a role change from an administrator later.</p><button disabled={loading} className="btn-primary min-w-44">{loading && <Loader2 className="size-4 animate-spin" />}{loading ? 'Saving profile' : 'Enter SAVORUNE'}</button></div>
    </form>
  </div>;
}
