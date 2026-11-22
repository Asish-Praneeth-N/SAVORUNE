import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get('scope') as any) || 'platform';

    const metrics = store.getImpactMetrics(
      scope,
      scope === 'me' && ctx ? ctx.user.id : undefined
    );

    return NextResponse.json({
      data: metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message || 'Failed to fetch impact metrics' } },
      { status: 500 }
    );
  }
}
