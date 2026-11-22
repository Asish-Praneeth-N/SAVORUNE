import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { store } from '@/lib/store';

export async function PUT(req: NextRequest) {
  try {
    await requireRole(['ADMIN']);
    const body = await req.json();

    const updated = store.updateImpactSettings({
      gramsPerMeal: body.gramsPerMeal ? Number(body.gramsPerMeal) : undefined,
      co2eKgPerKgFood: body.co2eKgPerKgFood !== undefined ? Number(body.co2eKgPerKgFood) : undefined,
      co2eSourceNote: body.co2eSourceNote,
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: error.code || 'INTERNAL', message: error.message } },
      { status: error.status || 500 }
    );
  }
}
