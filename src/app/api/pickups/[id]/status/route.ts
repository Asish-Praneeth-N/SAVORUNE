import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['COLLECTED', 'DELIVERED', 'FAILED', 'CANCELLED']),
  handoffPin: z.string().optional(),
  failureReason: z.enum([
    'DONOR_UNAVAILABLE',
    'RECEIVER_UNAVAILABLE',
    'VOLUNTEER_UNAVAILABLE',
    'FOOD_UNSUITABLE',
    'OTHER',
  ]).optional(),
  note: z.string().optional(),
});

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
    const validated = statusSchema.parse(body);

    const isAdmin = ctx.user.role === 'ADMIN';

    const result = store.updatePickupStatus(
      id,
      validated.status,
      ctx.user.id,
      {
        handoffPin: validated.handoffPin,
        failureReason: validated.failureReason,
        note: validated.note,
        isAdminOverride: isAdmin && !validated.handoffPin,
      }
    );

    return NextResponse.json({
      data: {
        pickup: result.pickup,
        donation: result.donation,
        outcome: result.outcome,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid status payload' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: error.code || 'BAD_REQUEST',
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status || 400 }
    );
  }
}
