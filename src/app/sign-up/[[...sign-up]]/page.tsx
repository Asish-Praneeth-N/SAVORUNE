import { SignUp } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Building2, HeartHandshake, Leaf, Store } from 'lucide-react';
import { store } from '@/lib/store';

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect(store.getUserByClerkId(userId) ? '/dashboard' : '/onboarding');
  return <div className="grid min-h-[calc(100vh-76px)] lg:grid-cols-[1.05fr_.95fr]">
    <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8"><div className="w-full max-w-md"><div className="mb-8"><span className="grid size-12 place-items-center rounded-2xl bg-forest text-lime"><Leaf className="size-6" /></span><h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Join the rescue network</h1><p className="mt-3 text-base leading-7 text-forest/60">Create your secure account first. You’ll choose your operational role immediately afterward.</p></div><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full shadow-none', card: 'w-full shadow-[0_20px_60px_rgba(16,43,36,.10)] border border-forest/10 rounded-3xl', headerTitle: 'hidden', headerSubtitle: 'hidden', formButtonPrimary: 'bg-natural hover:bg-forest text-white font-bold rounded-xl min-h-11', footerActionLink: 'text-natural font-bold', socialButtonsBlockButton: 'rounded-xl border-forest/15 min-h-11', formFieldInput: 'rounded-xl min-h-11 border-forest/15' } }} /></div></section>
    <section className="hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-center xl:p-16"><p className="text-sm font-extrabold uppercase tracking-[.14em] text-lime">Choose after registration</p><h2 className="mt-4 text-4xl font-extrabold">One network.<br />Three ways to help.</h2><div className="mt-10 space-y-4">{[{ icon: Store, title: 'Food donor', text: 'Post surplus and manage handoffs.' }, { icon: Building2, title: 'Receiver', text: 'Find suitable food and coordinate collection.' }, { icon: HeartHandshake, title: 'Volunteer', text: 'Accept and complete local pickups.' }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.05] p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime text-forest"><Icon className="size-5" /></span><div><p className="font-extrabold">{title}</p><p className="mt-1 text-sm text-white/55">{text}</p></div></div>)}</div></section>
  </div>;
}
