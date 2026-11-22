'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Show, UserButton, useAuth } from '@clerk/nextjs';
import { Award, Building2, LayoutDashboard, Leaf, LogIn, Menu, Package, Plus, ShieldCheck, Sparkles, Truck, UserRoundPlus, Users, X } from 'lucide-react';
import { DISCLAIMER_TEXT } from '@/lib/constants';

// Public (signed-out) navigation: only sections that exist on the landing page and
// matter to a first-time visitor. Role anchors are consolidated into one "Who it's for".
const publicLinks = [
  { href: '/#how-it-works', label: 'How it works', icon: Sparkles },
  { href: '/#roles', label: 'Who it’s for', icon: Users },
  { href: '/#impact', label: 'Impact', icon: Award },
  { href: '/#safety', label: 'Safety', icon: ShieldCheck },
];
const roleLinks: Record<string, typeof publicLinks> = {
  DONOR: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/donations', label: 'My donations', icon: Package }, { href: '/pickups', label: 'Handoffs', icon: Truck }, { href: '/impact', label: 'My impact', icon: Award }],
  RECEIVER: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/recommendations', label: 'Find food', icon: Sparkles }, { href: '/pickups', label: 'My pickups', icon: Truck }, { href: '/impact', label: 'Impact', icon: Award }],
  VOLUNTEER: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, { href: '/pickups', label: 'Open pickups', icon: Truck }, { href: '/impact', label: 'Impact', icon: Award }],
  ADMIN: [{ href: '/dashboard', label: 'Operations', icon: ShieldCheck }, { href: '/donations', label: 'Donations', icon: Package }, { href: '/pickups', label: 'Pickups', icon: Truck }, { href: '/impact', label: 'Analytics', icon: Award }],
};

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [profile, setProfile] = useState<any>(undefined);
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  const authPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  const landing = pathname === '/';

  useEffect(() => {
    setOpen(false);
    if (!isLoaded) return;
    if (!isSignedIn) { setProfile(null); return; }
    fetch('/api/me', { cache: 'no-store' }).then((r) => r.json()).then((d) => setProfile(d.data?.user || null)).catch(() => setProfile(null));
  }, [pathname, isLoaded, isSignedIn]);

  // Keep the progress bar imperative, but never mutate classes or text inside
  // streamed page segments. React owns that markup throughout hydration.
  useEffect(() => {
    if (!landing) return;
    const root = document.documentElement;

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [landing, pathname]);

  const links = isSignedIn ? (profile?.role ? roleLinks[profile.role] || [] : []) : publicLinks;
  const active = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  const ctaMobile = 'flex min-h-12 items-center justify-center gap-2 rounded-xl bg-natural px-4 text-sm font-extrabold text-white';

  return (
    <div className="flex min-h-screen flex-col">
      {landing && <div ref={bar} className="scroll-progress" aria-hidden="true" />}
      <header className="sticky top-0 z-50 border-b border-forest/10 bg-white/80 shadow-[0_1px_0_rgba(16,43,36,.03)] backdrop-blur-2xl">
        <nav aria-label="Primary navigation" className="container-x flex h-[68px] items-center gap-3">
          <Link href={profile ? '/dashboard' : isSignedIn ? '/onboarding' : '/'} className="mr-auto flex min-w-0 items-center gap-2.5 rounded-xl" aria-label="SAVORUNE home">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-forest text-lime shadow-[0_6px_16px_rgba(16,43,36,.18)]"><Leaf className="size-[18px]" /></span>
            <span className="min-w-0">
              <span className="block truncate font-heading text-[1.05rem] font-extrabold leading-none tracking-[-.04em]">SAVORUNE</span>
              <span className="mt-1 hidden text-[11px] font-semibold leading-none text-forest/50 sm:block">Food rescue network</span>
            </span>
          </Link>

          {!authPage && (
            <div className="mr-2 hidden items-center gap-1 lg:flex">
              {links.map(({ href, label }) => (
                <Link key={`${href}-${label}`} href={href} className={`rounded-[9px] px-3.5 py-2 text-sm font-bold transition ${active(href) ? 'bg-forest text-white shadow-sm' : 'text-forest/60 hover:bg-forest/5 hover:text-forest'}`}>{label}</Link>
              ))}
            </div>
          )}

          {!authPage && (
            <>
              <Show when="signed-out">
                <div className="flex items-center gap-2">
                  <Link href="/sign-in" className="btn-secondary min-h-10 px-3.5 py-2 sm:px-4"><LogIn className="size-4" /> Sign in</Link>
                  <Link href="/sign-up" className="btn-primary hidden min-h-10 px-4 py-2 sm:inline-flex"><UserRoundPlus className="size-4" /> Get started</Link>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="hidden items-center gap-3 sm:flex">
                  {profile === null && <Link href="/onboarding" className="btn-primary min-h-10 px-4 py-2"><Building2 className="size-4" /> Complete setup</Link>}
                  {profile?.role === 'DONOR' && <Link href="/donations/new" className="btn-primary min-h-10 px-4 py-2"><Plus className="size-4" /> Post surplus</Link>}
                  <UserButton appearance={{ elements: { userButtonAvatarBox: 'size-9 ring-2 ring-white shadow-sm' } }} />
                </div>
              </Show>
            </>
          )}

          {!authPage && (
            <button type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-xl border border-forest/10 bg-white lg:hidden">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}
        </nav>

        {open && (
          <div className="border-t border-forest/10 bg-white px-4 py-4 shadow-xl lg:hidden">
            <div className="mx-auto grid max-w-[1200px] gap-1 sm:grid-cols-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={`${href}-${label}`} href={href} className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-extrabold ${active(href) ? 'bg-forest text-white' : 'text-forest hover:bg-background'}`}><Icon className="size-5" />{label}</Link>
              ))}
              <Show when="signed-out">
                <Link href="/sign-in" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-extrabold hover:bg-background"><LogIn className="size-5" />Sign in</Link>
                <Link href="/sign-up" className={`${ctaMobile} sm:col-span-2`}><UserRoundPlus className="size-5" />Join network</Link>
              </Show>
              <Show when="signed-in">
                {profile === null && <Link href="/onboarding" className={`${ctaMobile} sm:col-span-2`}>Complete setup</Link>}
                {profile?.role === 'DONOR' && <Link href="/donations/new" className={`${ctaMobile} sm:col-span-2`}><Plus className="size-5" />Post surplus</Link>}
              </Show>
            </div>
          </div>
        )}
      </header>

      <main className={`w-full flex-1 ${authPage || landing ? 'max-w-none p-0' : 'container-x max-w-[1440px] py-8 sm:py-12'}`}>{children}</main>

      {isLoaded && !isSignedIn && landing && (
        <footer className="mt-auto bg-forest text-white">
          <div className="container-x py-14">
            <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
              <div>
                <div className="flex items-center gap-2.5 font-heading text-lg font-extrabold">
                  <span className="grid size-9 place-items-center rounded-xl bg-lime text-forest"><Leaf className="size-[18px]" /></span>SAVORUNE
                </div>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">Every portion deserves a purpose. Smart food rescue for donors, community organizations and volunteers.</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-lime">Synthetic demonstration platform</p>
              </div>
              <div>
                <p className="text-sm font-extrabold">Platform</p>
                <div className="mt-4 grid gap-3 text-sm text-white/60">
                  <Link href="/#how-it-works" className="hover:text-lime">How it works</Link>
                  <Link href="/#roles" className="hover:text-lime">Who it’s for</Link>
                  <Link href="/impact" className="hover:text-lime">Impact methodology</Link>
                </div>
              </div>
              <div>
                <p className="text-sm font-extrabold">Trust &amp; account</p>
                <div className="mt-4 grid gap-3 text-sm text-white/60">
                  <Link href="/#safety" className="hover:text-lime">Safety</Link>
                  <Link href="/about" className="hover:text-lime">About and terms</Link>
                  <Link href="/sign-in" className="hover:text-lime">Sign in</Link>
                </div>
              </div>
            </div>
            <div className="mt-8 flex max-w-5xl gap-3 rounded-xl border border-orange/20 bg-white/[.06] p-4 text-sm leading-6 text-white/70">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-orange" />
              <p><span className="font-extrabold text-white">Food rescue notice. </span>{DISCLAIMER_TEXT}</p>
            </div>
            <div className="mt-8 flex flex-col gap-2 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 SAVORUNE</p>
              <p>Built for ACE Builders&apos; Hackathon 2026</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
