import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { store } from '@/lib/store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN']);
    const { id } = await params;
    const body = await req.json();

    if (body.status !== 'ACTIVE' && body.status !== 'SUSPENDED') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Status must be ACTIVE or SUSPENDED' } },
        { status: 400 }
      );
    }

    const updated = store.updateUserStatus(id, body.status);
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: error.code || 'INTERNAL', message: error.message } },
      { status: error.status || 500 }
    );
  }
}
