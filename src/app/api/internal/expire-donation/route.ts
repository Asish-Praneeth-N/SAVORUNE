import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (!body.donationId || typeof body.donationId !== 'string') {
    return NextResponse.json({ error: 'donationId is required' }, { status: 400 });
  }
  // Reading a donation runs the store's idempotent lazy-expiry sweep.
  const detail = store.getDonationById(body.donationId);
  return NextResponse.json({ ok: true, status: detail?.donation.status || 'NOT_FOUND' });
}
