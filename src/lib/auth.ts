// SAVORUNE Auth & Session Helper (PRD Section 18)
import { auth, currentUser } from '@clerk/nextjs/server';
import { User, UserRole, DonorProfile, ReceiverProfile, VolunteerProfile } from './types';
import { store } from './store';

export interface AuthContext {
  user: User;
  donorProfile?: DonorProfile;
  receiverProfile?: ReceiverProfile;
  volunteerProfile?: VolunteerProfile;
  isClerkAuth?: boolean;
}

/**
 * Returns the currently authenticated user.
 * 1. Checks real Clerk session via auth() / currentUser()
 * 2. If Clerk user is logged in, links or creates the database user record
 * 3. Falls back to demo account cookie if no Clerk session is active
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  let clerkUserId: string | null = null;
  let clerkEmail: string | undefined;
  let clerkName: string | undefined;

  try {
    const session = await auth();
    if (session && session.userId) {
      clerkUserId = session.userId;
      const clerkUser = await currentUser();
      if (clerkUser) {
        clerkEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
        clerkName = clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim()
          : clerkEmail?.split('@')[0];
      }
    }
  } catch (e) {
    // Clerk session not present or in public access
  }

  let user: User | undefined;

  if (clerkUserId) {
    user = store.getUserByClerkId(clerkUserId);
    // A Clerk session is not an application profile. New users must complete
    // role-specific onboarding before any protected workflow is available.
  }

  if (!user || user.status === 'SUSPENDED') {
    return null;
  }

  const donorProfile = store.getDonorProfileByUserId(user.id);
  const receiverProfile = store.getReceiverProfileByUserId(user.id);
  const volunteerProfile = store.getVolunteerProfileByUserId(user.id);

  return {
    user,
    donorProfile,
    receiverProfile,
    volunteerProfile,
    isClerkAuth: Boolean(clerkUserId),
  };
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
  const ctx = await getCurrentUser();
  if (!ctx || !ctx.user) {
    throw { status: 401, code: 'UNAUTHENTICATED', message: 'Authentication required' };
  }

  if (ctx.user.status === 'SUSPENDED') {
    throw { status: 403, code: 'FORBIDDEN', message: 'Your account is suspended. Please contact platform support.' };
  }

  if (!allowedRoles.includes(ctx.user.role)) {
    throw {
      status: 403,
      code: 'FORBIDDEN',
      message: `Access denied. Role ${ctx.user.role} is not permitted for this resource.`,
    };
  }

  return ctx;
}
