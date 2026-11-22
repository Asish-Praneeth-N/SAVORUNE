import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { z } from 'zod';

const assignSchema = z.object({
  action: z.enum(['SELF_COLLECT', 'OPEN_TO_VOLUNTEERS', 'ACCEPT', 'WITHDRAW', 'ASSIGN']),
  volunteerId: z.string().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(
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
    const validated = assignSchema.parse(body);

    const updated = store.assignPickup(
      id,
      validated.action as any,
      ctx.user.id,
      {
        reason: validated.reason,
        note: validated.note,
      }
    );

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid assignment payload' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: error.code || 'BAD_REQUEST', message: error.message } },
      { status: error.status || 400 }
    );
  }
}
