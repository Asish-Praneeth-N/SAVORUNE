import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentUser();
    if (!ctx) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get('scope') as any) || 'all';

    let pickups = store.getPickups({
      scope: scope === 'open' ? 'open' : scope === 'mine' ? 'mine' : 'all',
      volunteerUserId: ctx.user.role === 'VOLUNTEER' ? ctx.user.id : undefined,
      receiverUserId: ctx.user.role === 'RECEIVER' ? ctx.user.id : undefined,
    });

    if (ctx.user.role === 'VOLUNTEER') {
      pickups = pickups.filter((pickup) => {
        if (scope === 'open') {
          return pickup.status === 'UNASSIGNED' && pickup.collectorType === 'VOLUNTEER';
        }
        if (scope === 'mine') {
          return pickup.volunteerId === ctx.volunteerProfile?.id;
        }
        return (
          pickup.volunteerId === ctx.volunteerProfile?.id ||
          (pickup.status === 'UNASSIGNED' && pickup.collectorType === 'VOLUNTEER')
        );
      });
    } else if (ctx.user.role === 'DONOR') {
      pickups = pickups.filter(
        (pickup) => pickup.donation?.donorId === ctx.donorProfile?.id
      );
    }

    const projectedPickups = pickups.map((pickup) => {
      const assignedVolunteer =
        ctx.user.role === 'VOLUNTEER' && pickup.volunteerId === ctx.volunteerProfile?.id;
      const canSeeOperationalDetails =
        ctx.user.role === 'ADMIN' ||
        ctx.user.role === 'DONOR' ||
        ctx.user.role === 'RECEIVER' ||
        assignedVolunteer;
      return {
        ...pickup,
        handoffPin: undefined,
        donation: pickup.donation
          ? {
              ...pickup.donation,
              pickupInstructions: canSeeOperationalDetails
                ? pickup.donation.pickupInstructions
                : null,
              pickupLatitude: canSeeOperationalDetails
                ? pickup.donation.pickupLatitude
                : null,
              pickupLongitude: canSeeOperationalDetails
                ? pickup.donation.pickupLongitude
                : null,
              handoffPin: undefined,
            }
          : undefined,
      };
    });

    return NextResponse.json({
      data: projectedPickups,
      meta: {
        total: projectedPickups.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message || 'Error listing pickups' } },
      { status: error.status || 500 }
    );
  }
}
