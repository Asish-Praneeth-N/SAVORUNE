import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export async function requirePageRole(allowed: UserRole[]) {
  const context = await getCurrentUser();
  if (context?.user && allowed.includes(context.user.role)) return context;
  if (context?.user) redirect('/dashboard?error=forbidden');
  const { userId } = await auth();
  if (userId) redirect('/onboarding');
  redirect('/sign-in');
}
