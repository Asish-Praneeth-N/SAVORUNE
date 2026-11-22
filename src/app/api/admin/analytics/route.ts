import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET() {
  try {
    await requireRole(['ADMIN']);
    const analytics = store.getAdminAnalytics();
    return NextResponse.json({ data: analytics });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: error.code || 'INTERNAL', message: error.message } },
      { status: error.status || 500 }
    );
  }
}
