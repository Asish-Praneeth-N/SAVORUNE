import type { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { store } from '@/lib/store';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (store.getUserByClerkId(userId)) redirect('/dashboard');
  return children;
}
