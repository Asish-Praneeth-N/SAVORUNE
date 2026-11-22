import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, Building2, Check, CheckCircle2, Clock3, HandHeart, HeartHandshake, Leaf, MapPin, PackageCheck, Scale, ShieldCheck, Sparkles, Store, Thermometer, Truck, Utensils } from 'lucide-react';
import { store } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

const problems = [
  { icon: Clock3, title: 'Surplus is time-sensitive', text: 'Food may be available for only a few hours before the collection window closes.' },
  { icon: Scale, title: 'Suitability is complicated', text: 'Distance, quantity, capacity, dietary needs and timing all affect a useful match.' },
  { icon: Truck, title: 'A claim is not a delivery', text: 'Clear ownership and live status are needed until the handoff is complete.' },
];
const steps = [
  { icon: Utensils, title: 'Post', text: 'A donor records food, quantity, deadline, storage and allergens in under a minute.' },
  { icon: Sparkles, title: 'Match', text: 'Eligible receivers are ranked by distance, quantity fit, timing and current need.' },
  { icon: Truck, title: 'Collect', text: 'The receiver self-collects or opens the pickup to a nearby volunteer.' },
  { icon: PackageCheck, title: 'Measure', text: 'Only successfully delivered donations contribute to impact totals.' },
];
const roles = [
  { id: 'donors', icon: Store, label: 'For restaurants', title: 'Turn today’s surplus into a scheduled pickup.', points: ['Post in under 60 seconds', 'See claim and pickup status', 'Track delivered contributions'], cta: 'Donate surplus food', href: '/sign-up?role=DONOR', primary: true, anim: 'left' },
  { id: 'receivers', icon: Building2, label: 'For community organizations', title: 'Find food that fits your capacity and requirements.', points: ['See ranked suitable donations', 'Review handling and allergen details', 'Self-collect or request support'], cta: 'Find available food', href: '/sign-up?role=RECEIVER', primary: false, anim: 'up' },
  { id: 'volunteer', icon: HandHeart, label: 'For local volunteers', title: 'Help complete a pickup before time runs out.', points: ['See open pickups nearest first', 'Accept a feasible assignment', 'Confirm collection and delivery'], cta: 'Become a volunteer', href: '/sign-up?role=VOLUNTEER', primary: false, anim: 'right' },
];
const trust = ['Under 60-second posting', 'Explainable matches', 'Delivered-only impact'];
const matchChecks = ['Can receive the full 25 kg', 'Collection is feasible before the deadline', 'Strong current need in this zone'];
const matchScores = [['Distance', 88], ['Quantity', 100], ['Timing', 94], ['Need', 82]] as const;
const rescueStages = ['Posted', 'Claimed', 'Collected', 'Delivered'];
const trackingStages = [['Posted', '10:02'], ['Claimed', '10:11'], ['Collected', '11:05'], ['Delivered', 'Next']];
const safetyPoints = ['Deadlines stay visible', 'Allergens are never hidden', 'Acknowledgments are recorded', 'Private details stay limited'];
const headline = ['Every', 'portion', 'deserves'];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    const context = await getCurrentUser();
    redirect(context?.user ? '/dashboard' : '/onboarding');
  }
  const { totals } = store.getImpactMetrics('platform');
  const metrics = [
    { value: Number(totals.deliveredCount), unit: '', label: 'successfully delivered', note: 'Recorded' },
    { value: Math.round(totals.kgRescued), unit: 'kg', label: 'food delivered', note: 'Recorded' },
    { value: Math.round(totals.mealsSaved), unit: '', label: 'estimated meals', note: 'Estimate' },
    { value: Math.round(totals.kgRescued), unit: 'kg', label: 'estimated waste avoided', note: 'Estimate' },
  ];

  return (
    <div className="landing-page">

      {/* ───────── Hero ───────── */}
      <section className="relative isolate overflow-hidden border-b border-forest/10 bg-white" aria-labelledby="hero-title">
        <div className="hero-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="hero-glow absolute -right-24 -top-24 -z-10 size-[30rem] rounded-full" aria-hidden="true" />
        <div className="hero-glow hero-glow-b absolute -bottom-40 -left-32 -z-10 size-[24rem] rounded-full" aria-hidden="true" />

        <div className="container-x grid items-center gap-16 py-16 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:py-28">
          <div>
            <div className="hero-reveal hero-delay-1 inline-flex items-center gap-2 rounded-full border border-natural/20 bg-natural/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-natural">
              <Leaf className="size-3.5" /> Food rescue, coordinated
            </div>

            <h1 id="hero-title" className="mt-6 max-w-2xl text-[2.7rem] font-extrabold leading-[1.03] tracking-[-.05em] text-forest sm:text-6xl lg:text-[4.5rem]">
              {headline.map((word, i) => (
                <span key={word} className="hero-word" style={{ animationDelay: `${180 + i * 90}ms` }}>{word}&nbsp;</span>
              ))}
              <span className="hero-word" style={{ animationDelay: '470ms' }}><span className="hl">a purpose.</span></span>
            </h1>

            <p className="hero-reveal hero-delay-3 mt-6 max-w-xl text-base leading-7 text-forest/65 sm:text-lg sm:leading-8">
              Post surplus food in under a minute. SAVORUNE matches it to a nearby receiver that can actually use it, then keeps everyone on one clear status until it’s delivered.
            </p>

            <div className="hero-reveal hero-delay-4 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up?role=DONOR" className="btn-primary group px-6">Donate surplus food</Link>
              <Link href="/sign-up?role=RECEIVER" className="btn-secondary px-6">Receive food</Link>
            </div>

            <div className="hero-reveal hero-delay-5 mt-7 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
              <Link href="/sign-up?role=VOLUNTEER" className="group inline-flex items-center gap-2 font-bold text-forest/65 hover:text-natural">
                <HandHeart className="size-4 text-natural" />
                Want to help with pickups? <span className="underline decoration-forest/20 underline-offset-4 group-hover:decoration-natural">Volunteer</span>
              </Link>
              <span className="hidden h-4 w-px bg-forest/15 sm:block" aria-hidden="true" />
              <span className="font-semibold text-forest/55">Already a member? <Link href="/sign-in" className="font-extrabold text-natural underline decoration-natural/30 underline-offset-4 hover:decoration-natural">Sign in</Link></span>
            </div>
          </div>

          {/* Product preview */}
          <div className="rescue-demo relative mx-auto w-full max-w-[520px]">
            <div className="float-chip float-a absolute -left-4 -top-5 z-10 hidden items-center gap-2 rounded-xl border border-forest/10 bg-white px-3 py-2 text-xs font-extrabold shadow-lg sm:flex">
              <span className="grid size-6 place-items-center rounded-lg bg-lime text-forest"><Sparkles className="size-3.5" /></span> Match found in seconds
            </div>
            <div className="float-chip float-b absolute -bottom-5 -right-3 z-10 hidden items-center gap-2 rounded-xl border border-forest/10 bg-white px-3 py-2 text-xs font-extrabold shadow-lg sm:flex">
              <span className="grid size-6 place-items-center rounded-lg bg-natural text-white"><Check className="size-3.5" /></span> Pickup claimed
            </div>

            <div className="panel relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-forest/45">
                    <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-natural/50" /><span className="relative inline-flex size-2 rounded-full bg-natural" /></span>
                    Live rescue
                  </p>
                  <p className="mt-1.5 font-heading text-xl font-extrabold">Veg biryani &amp; salan</p>
                </div>
                <span className="rounded-full bg-forest px-3 py-1.5 text-xs font-extrabold text-lime">91 / 100 match</span>
              </div>

              <div className="mt-5 grid grid-cols-3 divide-x divide-forest/10 rounded-xl bg-background py-4">
                {[[Scale, '25 kg', 'available'], [Clock3, '2h 42m', 'remaining'], [MapPin, '1.6 km', 'distance']].map(([Icon, value, label]) => {
                  const I = Icon as typeof Scale;
                  return (
                    <div key={label as string} className="px-4">
                      <I className="size-4 text-natural" />
                      <p className="mt-2 font-mono text-lg font-bold">{value as string}</p>
                      <p className="text-xs text-forest/50">{label as string}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 rounded-xl border border-forest/10 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-natural/10 text-natural"><HeartHandshake className="size-5" /></span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">Hope Harvest Kitchen</p>
                  <p className="mt-0.5 text-xs leading-5 text-forest/55">Capacity, dietary and timing checks passed</p>
                </div>
                <CheckCircle2 className="ml-auto size-5 shrink-0 text-natural" />
              </div>

              <div className="mt-6 grid grid-cols-4 gap-1" aria-label="Example rescue status">
                {rescueStages.map((label, index) => (
                  <div key={label} className="rescue-stage text-center">
                    <div className={`mx-auto size-2.5 rounded-full ${index < 3 ? 'bg-natural' : 'bg-forest/15'}`} />
                    <div className={`mt-2 h-0.5 ${index < 3 ? 'bg-natural/50' : 'bg-forest/10'}`} />
                    <p className="mt-2 text-[11px] font-bold text-forest/55">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t border-forest/10 bg-background/60">
          <div className="container-x flex flex-col gap-3 py-5 text-sm font-semibold text-forest/65 sm:flex-row sm:items-center sm:justify-between">
            {trust.map((item, i) => (
              <span key={item} data-reveal="up" data-delay={i + 1} className="flex items-center gap-2"><Check className="size-4 text-natural" />{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Problem ───────── */}
      <section id="problem" className="section-pad scroll-mt-20" aria-labelledby="problem-title">
        <div className="container-x">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
            <div data-reveal="left">
              <p className="eyebrow">The coordination gap</p>
              <h2 id="problem-title" className="section-title mt-4">Good food is often available. The right people hear about it too late.</h2>
            </div>
            <p data-reveal="right" data-delay="2" className="section-lead">Surplus is known only hours before it must be collected. Receivers need accurate information, and volunteers need a clear handoff—not another unreliable message thread.</p>
          </div>
          <div className="mt-12 grid divide-y divide-forest/10 overflow-hidden rounded-2xl border border-forest/10 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
            {problems.map(({ icon: Icon, title, text }, i) => (
              <article key={title} data-reveal="up" data-delay={i + 1} className="group p-7 transition-colors hover:bg-natural/[.03] sm:p-9">
                <span className="grid size-11 place-items-center rounded-xl bg-natural/10 text-natural transition group-hover:scale-110 group-hover:bg-natural group-hover:text-white"><Icon className="size-5" /></span>
                <h3 className="mt-6 text-lg font-extrabold">{title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-forest/60">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how-it-works" className="section-pad scroll-mt-20 border-y border-forest/10 bg-white" aria-labelledby="flow-title">
        <div className="container-x">
          <div data-reveal="down" className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">One accountable handoff</p>
            <h2 id="flow-title" className="section-title mt-4">From surplus to served in four clear steps.</h2>
            <p className="section-lead mt-5">Every person sees the information and next action they need—without losing sight of the collection deadline.</p>
          </div>
          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} data-reveal="up" data-delay={index + 1} className="group relative">
                {index < steps.length - 1 && <span className="absolute -right-3 left-16 top-6 hidden h-px bg-forest/10 lg:block" aria-hidden="true"><span className="grow-line block h-full w-full bg-natural/60" /></span>}
                <span className="relative z-10 grid size-12 place-items-center rounded-xl bg-forest text-lime transition group-hover:-translate-y-1 group-hover:bg-natural group-hover:text-white"><Icon className="size-5" /></span>
                <p className="mt-6 font-mono text-xs font-bold text-natural">STEP 0{index + 1}</p>
                <h3 className="mt-1 text-xl font-extrabold">{title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-forest/60">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Matching ───────── */}
      <section className="section-pad overflow-hidden bg-forest text-white" aria-labelledby="matching-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div data-reveal="left">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-lime">Transparent matching</p>
            <h2 id="matching-title" className="section-title mt-4">A useful match—not just the nearest pin.</h2>
            <p className="mt-6 text-base leading-8 text-white/70">SAVORUNE first checks whether a receiver can actually accept the donation. Eligible organizations are ranked using distance, quantity fit, collection timing and current need.</p>
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.06] p-4 text-sm leading-6 text-white/80">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-lime" />
              <p>No black box. Every recommendation includes a plain-language reason and score breakdown.</p>
            </div>
          </div>

          <div data-reveal="right" data-delay="2" className="rounded-2xl bg-white p-5 text-forest shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-natural">Top suitable receiver</p>
                <h3 className="mt-2 text-xl font-extrabold">Hope Harvest Kitchen</h3>
                <p className="mt-1 text-sm text-forest/50">Community kitchen · 1.6 km away</p>
              </div>
              <span className="rounded-xl bg-forest px-3 py-2 font-mono text-sm font-bold text-lime">91 / 100</span>
            </div>
            <div className="mt-6 space-y-2.5">
              {matchChecks.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl bg-background px-4 py-3 text-sm font-bold">
                  <CheckCircle2 className="size-5 shrink-0 text-natural" />{item}
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {matchScores.map(([label, score]) => (
                <div key={label} className="rounded-xl border border-forest/10 p-3">
                  <p className="font-mono text-base font-bold">{score}</p>
                  <p className="mt-0.5 text-xs text-forest/45">{label}</p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-forest/10">
                    <span className="grow-x block h-full origin-left rounded-full bg-natural" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Roles ───────── */}
      <section id="roles" className="section-pad scroll-mt-20" aria-labelledby="roles-title">
        <div className="container-x">
          <div data-reveal="down" className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Choose your role</p>
            <h2 id="roles-title" className="section-title mt-4">One rescue. Three ways to take part.</h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {roles.map(({ id, icon: Icon, label, title, points, cta, href, primary, anim }) => (
              <article id={id} key={id} data-reveal={anim} className="panel group scroll-mt-24 flex flex-col p-7 sm:p-8">
                <span className="grid size-12 place-items-center rounded-xl bg-forest text-lime transition group-hover:rotate-6 group-hover:scale-110"><Icon className="size-5" /></span>
                <p className="mt-6 text-xs font-extrabold uppercase tracking-[.12em] text-natural">{label}</p>
                <h3 className="mt-2.5 text-2xl font-extrabold leading-tight">{title}</h3>
                <ul className="mt-6 space-y-3">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-forest/70">
                      <Check className="mt-1 size-4 shrink-0 text-natural" />{point}
                    </li>
                  ))}
                </ul>
                <Link href={href} className={`${primary ? 'btn-primary' : 'btn-secondary'} mt-9 w-full`}>{cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Live tracking ───────── */}
      <section className="section-pad overflow-hidden border-y border-forest/10 bg-white" aria-labelledby="tracking-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div data-reveal="left">
            <p className="eyebrow">Live coordination</p>
            <h2 id="tracking-title" className="section-title mt-4">Everyone sees what happens next.</h2>
            <p className="section-lead mt-5">The donor, receiver and collector share one clear status. Countdown timers and next actions keep the rescue moving.</p>
          </div>
          <div data-reveal="right" data-delay="2" className="rounded-2xl border border-forest/10 bg-background p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold">Veg biryani &amp; salan</p>
                <p className="mt-1 text-xs text-forest/50">Pickup coordinated by volunteer</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange/20 px-3 py-1.5 text-xs font-extrabold text-forest"><Clock3 className="size-3.5" /> 1h 37m left</span>
            </div>
            <div className="mt-8 grid sm:grid-cols-4">
              {trackingStages.map(([label, time], index) => (
                <div key={label} className="relative pb-6 sm:pb-0 sm:text-center">
                  <div className={`relative z-10 grid size-9 place-items-center rounded-full sm:mx-auto ${index < 3 ? 'bg-natural text-white' : 'border-2 border-natural bg-white text-natural'}`}>
                    {index < 3 ? <Check className="size-4" /> : <PackageCheck className="size-4" />}
                  </div>
                  {index < 3 && <div className="grow-line absolute left-[17px] top-9 h-[calc(100%-36px)] w-0.5 bg-natural/40 sm:left-1/2 sm:top-[17px] sm:h-0.5 sm:w-full" style={{ transitionDelay: `${0.5 + index * 0.35}s` }} />}
                  <p className="mt-2 pl-12 text-sm font-extrabold sm:pl-0">{label}</p>
                  <p className="mt-1 pl-12 font-mono text-xs text-forest/45 sm:pl-0">{time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Impact ───────── */}
      <section id="impact" className="section-pad scroll-mt-20" aria-labelledby="impact-title">
        <div className="container-x">
          <div data-reveal="down" className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">Measured after delivery</p>
              <h2 id="impact-title" className="section-title mt-4">Count what was delivered—not what was promised.</h2>
            </div>
            <p className="max-w-sm text-base leading-7 text-forest/60">Recorded quantities and estimated outcomes are always shown separately.</p>
          </div>

          <div data-reveal="left" className="mt-10 inline-flex items-center gap-2 rounded-full border border-natural/20 bg-natural/5 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.12em] text-natural">
            <span className="size-1.5 rounded-full bg-natural" /> Privacy-safe service-zone data
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <article key={m.label} data-reveal="up" data-delay={i + 1} className="panel p-6">
                <div className="flex items-start justify-between">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-extrabold ${m.note === 'Recorded' ? 'bg-natural/10 text-natural' : 'bg-orange/20 text-forest/70'}`}>{m.note}</span>
                  <Leaf className="size-5 text-natural/30" />
                </div>
                <div className="mt-8 font-mono text-4xl font-bold tracking-[-.05em]"><span data-count={m.value} className="tabular-nums">{m.value.toLocaleString('en-US')}</span><span className="ml-1 text-lg text-forest/45">{m.unit}</span></div>
                <p className="mt-2 text-sm font-bold text-forest/60">{m.label}</p>
              </article>
            ))}
          </div>

          <div data-reveal="up" className="mt-6 flex flex-col gap-4 rounded-xl border border-forest/10 bg-white p-5 text-sm leading-6 text-forest/60 sm:flex-row sm:items-center sm:justify-between">
            <p>Estimated meals use the configured grams-per-meal assumption. Waste avoided assumes delivered surplus would otherwise have been discarded.</p>
            <Link href="/impact" className="group inline-flex shrink-0 items-center gap-1.5 font-extrabold text-natural hover:underline">See the methodology <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </div>
      </section>

      {/* ───────── Safety ───────── */}
      <section id="safety" className="section-pad scroll-mt-20 overflow-hidden border-t border-forest/10 bg-white" aria-labelledby="safety-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div data-reveal="left">
            <p className="eyebrow">Safety and trust</p>
            <h2 id="safety-title" className="section-title mt-4">Clear information supports better decisions.</h2>
            <p className="section-lead mt-5">Handling details, allergens and the collection window remain visible at every critical decision. SAVORUNE coordinates the rescue; participants independently assess the food.</p>
            <ul className="mt-8 grid gap-3 text-sm font-bold text-forest/75 sm:grid-cols-2">
              {safetyPoints.map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-natural" />{item}</li>)}
            </ul>
          </div>

          <div data-reveal="right" data-delay="2" className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-orange/20 text-forest"><Thermometer className="size-5" /></span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-natural">Handling information</p>
                <p className="mt-1 font-extrabold">Review before accepting</p>
              </div>
            </div>
            <dl className="mt-7 grid grid-cols-[auto_1fr] gap-x-8 gap-y-4 border-t border-forest/10 pt-6 text-sm">
              <dt className="text-forest/45">Pickup by</dt><dd className="font-bold">Today, 2:30 PM</dd>
              <dt className="text-forest/45">Storage</dt><dd className="font-bold">Chilled</dd>
              <dt className="text-forest/45">Allergens</dt><dd className="font-bold">Contains dairy</dd>
              <dt className="text-forest/45">Preparation</dt><dd className="font-bold">Time not provided</dd>
            </dl>
            <div className="mt-7 flex gap-3 rounded-xl bg-orange/15 p-4 text-sm leading-6">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange" />
              <p>Independently inspect the food before accepting it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="relative overflow-hidden bg-forest px-4 py-20 text-center text-white sm:px-6 sm:py-28">
        <div className="absolute inset-x-[20%] -top-24 h-48 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
        <div data-reveal="zoom" className="relative mx-auto max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.14em] text-lime">Ready when surplus appears</p>
          <h2 className="section-title mt-4">The next rescue can begin in under a minute.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/70">Share surplus, receive suitable food, or help complete a local pickup.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sign-up?role=DONOR" className="btn-lime group">Donate surplus food <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link href="/sign-up?role=RECEIVER" className="btn-ghost-light">Receive food</Link>
            <Link href="/sign-up?role=VOLUNTEER" className="btn-ghost-light border-transparent">Become a volunteer</Link>
          </div>
          <p className="mt-6 text-sm text-white/55">Already have an account? <Link href="/sign-in" className="font-extrabold text-lime underline decoration-lime/30 underline-offset-4 hover:decoration-lime">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
