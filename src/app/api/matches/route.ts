import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { store } from '@/lib/store';
import { computeMatchForReceiver } from '@/lib/matching';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireRole(['RECEIVER', 'ADMIN']);
    const { searchParams } = new URL(req.url);

    const includeIneligible = searchParams.get('includeIneligible') === 'true';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    let receiver = ctx.receiverProfile;
    const adminReceiverId = searchParams.get('receiverId');
    if (ctx.user.role === 'ADMIN' && adminReceiverId) {
      receiver = store['state'].receiverProfiles.find((r) => r.id === adminReceiverId);
    }

    if (!receiver) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Receiver profile not found' } },
        { status: 404 }
      );
    }

    const now = new Date();
    const capacityMeta = store.getReceiverRemainingCapacity(receiver.id, now);
    const postedDonations = store.getDonations({ status: 'POSTED' });

    const matches = postedDonations.map((donation) => {
      return computeMatchForReceiver(
        donation,
        receiver!,
        capacityMeta.remainingCapacityKg,
        now
      );
    });

    let eligible = matches.filter((m) => m.eligible && m.finalScore !== null);
    eligible.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

    let ineligible = matches.filter((m) => !m.eligible);

    const selectedMatches = includeIneligible ? matches : eligible.slice(0, limit);
    const projectedMatches = selectedMatches.map((match) => ({
      ...match,
      donation: match.donation
        ? {
            ...match.donation,
            pickupInstructions: null,
            pickupLatitude: null,
            pickupLongitude: null,
            handoffPin: undefined,
          }
        : undefined,
      // Match explanations may describe eligibility, but the receiver profile
      // itself is never part of a discovery response.
      receiver: undefined,
    }));

    return NextResponse.json({
      data: projectedMatches,
      meta: {
        dailyCapacityKg: capacityMeta.dailyCapacityKg,
        committedTodayKg: capacityMeta.committedTodayKg,
        remainingCapacityKg: capacityMeta.remainingCapacityKg,
        eligibleCount: eligible.length,
        ineligibleCount: ineligible.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: error.code || 'INTERNAL', message: error.message || 'Matching failed' } },
      { status: error.status || 500 }
    );
  }
}
