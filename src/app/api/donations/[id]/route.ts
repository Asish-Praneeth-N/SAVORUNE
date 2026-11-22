import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getCurrentUser();

    const detail = store.getDonationById(
      id,
      ctx ? { role: ctx.user.role, userId: ctx.user.id } : undefined
    );

    if (!detail) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Donation not found' } },
        { status: 404 }
      );
    }

    // Role visibility rules (BL-10): Instructions and exact map pin visible to:
    // 1. Donor owner
    // 2. Claimant receiver
    // 3. Assigned volunteer
    // 4. Admin
    let showExactDetails = false;
    if (ctx) {
      if (ctx.user.role === 'ADMIN') showExactDetails = true;
      if (ctx.donorProfile && ctx.donorProfile.id === detail.donation.donorId) showExactDetails = true;
      if (detail.activeClaim && ctx.receiverProfile && detail.activeClaim.receiverId === ctx.receiverProfile.id) {
        showExactDetails = true;
      }
      if (detail.activePickup && ctx.volunteerProfile && detail.activePickup.volunteerId === ctx.volunteerProfile.id) {
        showExactDetails = true;
      }
    }

    const donationSafe = {
      ...detail.donation,
      pickupInstructions: showExactDetails ? detail.donation.pickupInstructions : null,
      pickupLatitude: showExactDetails ? detail.donation.pickupLatitude : null,
      pickupLongitude: showExactDetails ? detail.donation.pickupLongitude : null,
      handoffPin: showExactDetails ? detail.revealedPin : null,
    };

    return NextResponse.json({
      data: {
        donation: donationSafe,
        history: detail.history,
        activeClaim: detail.activeClaim || null,
        activePickup: detail.activePickup || null,
        handoffPin: detail.revealedPin || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message || 'Error fetching donation' } },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await getCurrentUser();
    if (!ctx) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (body.action === 'CANCEL') {
      const updated = store.cancelDonation(id, body.reason || 'Cancelled by donor', ctx.user.id);
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Unsupported action' } },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: error.code || 'BAD_REQUEST', message: error.message } },
      { status: error.status || 400 }
    );
  }
}
