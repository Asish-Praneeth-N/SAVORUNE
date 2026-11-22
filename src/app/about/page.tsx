import { Check, Leaf, ShieldCheck } from 'lucide-react';
import { DISCLAIMER_TEXT } from '@/lib/constants';

const requirements = [
  ['Donor flow under 60 seconds', 'Quick Donation uses one-tap presets, steppers, and auto-derived storage conditions.'],
  ['Smart matching', 'Transparent weighted scoring combines distance, quantity, timing, and current need with capacity-aware filters.'],
  ['Pickup coordination', 'A clear Posted, Claimed, Collected, and Delivered lifecycle keeps ownership visible through handoff.'],
  ['Measurable impact', 'Only verified deliveries enter totals, with recorded quantities separated from mathematical estimates.'],
  ['Handling guidance', 'Storage conditions, allergen warnings, and mandatory acknowledgements remain visible when they matter.'],
];

const guardrails = [
  ['Synthetic locations', 'All locations use zone centroids inside the demonstration area; the product does not require real addresses.'],
  ['Private by design', 'Free-text fields reject personal phone numbers and email addresses.'],
  ['No certification claims', 'SAVORUNE coordinates logistics and does not certify that food is safe.'],
  ['No financial promises', 'Impact records do not imply tax, CSR, or legal benefits.'],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4">
      <section className="relative overflow-hidden rounded-[18px] bg-forest p-7 text-white shadow-[0_24px_70px_rgba(16,43,36,.18)] sm:p-10">
        <div className="absolute -right-16 -top-20 size-60 rounded-full border-[44px] border-lime/[.07]" aria-hidden="true" />
        <span className="relative grid size-12 place-items-center rounded-[12px] bg-lime text-forest"><Leaf className="size-6" /></span>
        <p className="relative mt-7 text-xs font-extrabold uppercase tracking-[.14em] text-lime">Purpose, trust and product rules</p>
        <h1 className="relative mt-3 text-4xl font-extrabold text-white sm:text-5xl">About SAVORUNE</h1>
        <p className="relative mt-5 max-w-2xl text-base leading-7 text-white/65">SAVORUNE bridges the coordination gap between food businesses with edible surplus and community organizations that can put it to use.</p>
        <p className="relative mt-5 text-sm font-semibold text-white/45">ACE Builders&apos; Hackathon 2026 · CodeBenders · Society and Environment</p>
      </section>
      <section className="panel p-6 sm:p-8">
        <p className="eyebrow">Product foundation</p><h2 className="mt-3 text-2xl font-extrabold">Five requirements shape every workflow.</h2>
        <div className="mt-7 grid gap-3">{requirements.map(([title, text]) => <div key={title} className="flex gap-4 rounded-[12px] border border-forest/10 bg-background/60 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-natural text-white"><Check className="size-4" /></span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-forest/60">{text}</p></div></div>)}</div>
      </section>
      <section className="panel p-6 sm:p-8">
        <p className="eyebrow">Ethical guardrails</p><h2 className="mt-3 text-2xl font-extrabold">Trust is a product constraint.</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">{guardrails.map(([title, text]) => <div key={title} className="rounded-[12px] border border-forest/10 p-5"><h3 className="font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-forest/60">{text}</p></div>)}</div>
      </section>
      <aside className="rounded-[14px] border border-orange/30 bg-orange/10 p-5 text-sm text-forest"><div className="flex items-center gap-2 font-extrabold"><ShieldCheck className="size-5 text-orange" /> Food rescue notice</div><p className="mt-2 leading-6 text-forest/70">{DISCLAIMER_TEXT}</p></aside>
    </div>
  );
}
