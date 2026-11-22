import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const ctx = await getCurrentUser();
    return NextResponse.json({
      data: {
        user: ctx?.user || null,
        donorProfile: ctx?.donorProfile || null,
        receiverProfile: ctx?.receiverProfile || null,
        volunteerProfile: ctx?.volunteerProfile || null,
        isClerkAuth: ctx?.isClerkAuth || false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message || 'Failed to fetch user' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx = await getCurrentUser();

    if (body.onboard === true && !ctx?.user) {
      const session = await auth();
      if (!session.userId) {
        return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }, { status: 401 });
      }
      if (store.getUserByClerkId(session.userId)) {
        return NextResponse.json({ error: { code: 'PROFILE_EXISTS', message: 'This account already has a SAVORUNE profile.' } }, { status: 409 });
      }
      const allowedRoles: UserRole[] = ['DONOR', 'RECEIVER', 'VOLUNTEER'];
      if (!allowedRoles.includes(body.role as UserRole)) {
        return NextResponse.json({ error: { code: 'INVALID_ROLE', message: 'Choose donor, receiver, or volunteer.' } }, { status: 400 });
      }
      const clerkUser = await currentUser();
      const displayName = String(body.displayName || clerkUser?.firstName || 'SAVORUNE member').trim();
      const result = store.createOnboardedUser({
        clerkUserId: session.userId,
        displayName,
        role: body.role,
        zoneCode: body.zoneCode,
        donorFields: body.role === 'DONOR' ? { businessName: body.organizationName, defaultInstructions: body.instructions } : undefined,
        receiverFields: body.role === 'RECEIVER' ? { organizationName: body.organizationName, receiverType: body.receiverType || 'NGO', dailyCapacityKg: Number(body.dailyCapacityKg || 40), dietPolicy: 'ANY', avoidAllergens: [], preferredCategories: ['COOKED_MEAL'], needLevel: 3 } : undefined,
        volunteerFields: body.role === 'VOLUNTEER' ? { availabilityNote: body.availabilityNote || '' } : undefined,
      });
      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (body.role && ctx?.user) {
      return NextResponse.json({ error: { code: 'ROLE_LOCKED', message: 'Role changes require administrator approval.' } }, { status: 403 });
    }

    return NextResponse.json({ data: { user: ctx?.user || null } });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: error.message || 'Failed to update user' } },
      { status: 400 }
    );
  }
}
