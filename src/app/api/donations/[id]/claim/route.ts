import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { store } from '@/lib/store';
import { z } from 'zod';

const claimSchema = z.object({
  safetyAck: z.literal(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireRole(['RECEIVER']);
    const body = await req.json();

    // Check strict body: reject any client-submitted collectorType (FR-D6, BL-20, AC-32)
    if ('collectorType' in body) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message:
              'The claim request must not carry a collector choice. Collector is selected after claiming.',
          },
        },
        { status: 400 }
      );
    }

    const validated = claimSchema.parse(body);

    const result = store.claimDonation(id, ctx.user.id, validated.safetyAck);

    return NextResponse.json(
      {
        data: {
          claim: result.claim,
          pickup: result.pickup,
          donation: result.donation,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'You must explicitly acknowledge the food safety and handling information.',
          },
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: error.code || 'BAD_REQUEST',
          message: error.message || 'Claim failed',
          details: error.details,
        },
      },
      { status: error.status || 400 }
    );
  }
}
