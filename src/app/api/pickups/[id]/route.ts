import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentUser();
    if (!ctx) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const pickup = store.getPickupById(id, {
      role: ctx.user.role,
      userId: ctx.user.id,
    });

    if (!pickup) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pickup not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: pickup });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          code: error.code || 'INTERNAL',
          message: error.message || 'Error fetching pickup',
        },
      },
      { status: error.status || 500 }
    );
  }
}
