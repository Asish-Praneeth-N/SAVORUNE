import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Check, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { store } from '@/lib/store';

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect(store.getUserByClerkId(userId) ? '/dashboard' : '/onboarding');
  return <div className="grid min-h-[calc(100vh-76px)] overflow-hidden lg:grid-cols-[.9fr_1.1fr]">
    <section className="relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16"><div className="absolute -left-32 -top-32 size-96 rounded-full border-[70px] border-lime/[.06]" /><div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.14em] text-lime"><Sparkles className="size-4" /> Secure member access</span><h1 className="mt-8 max-w-xl text-5xl font-extrabold leading-[1.02] xl:text-6xl">Your next rescue starts here.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/65">Sign in to see only the donations, matches and handoffs permitted for your role.</p></div><div className="relative space-y-4">{['Clerk-secured authentication', 'Role-specific workspace', 'No real addresses or contact details'].map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold text-white/70"><span className="grid size-7 place-items-center rounded-full bg-lime text-forest"><Check className="size-4" /></span>{item}</p>)}</div>
    </section>
    <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8"><div className="w-full max-w-md"><div className="mb-8 text-center lg:text-left"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-forest text-lime lg:mx-0"><Leaf className="size-6" /></span><h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">Welcome back</h2><p className="mt-3 text-base text-forest/60">Sign in securely to continue to SAVORUNE.</p></div><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full shadow-none', card: 'w-full shadow-[0_20px_60px_rgba(16,43,36,.10)] border border-forest/10 rounded-3xl', headerTitle: 'hidden', headerSubtitle: 'hidden', formButtonPrimary: 'bg-natural hover:bg-forest text-white font-bold rounded-xl min-h-11', footerActionLink: 'text-natural font-bold', socialButtonsBlockButton: 'rounded-xl border-forest/15 min-h-11', formFieldInput: 'rounded-xl min-h-11 border-forest/15' } }} /><div className="mt-6 flex items-center justify-center gap-2 text-xs text-forest/45"><ShieldCheck className="size-4" /> Authentication is handled securely by Clerk.</div></div></section>
  </div>;
}
