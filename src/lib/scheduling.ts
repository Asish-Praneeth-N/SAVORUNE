import 'server-only';
import { tasks } from '@trigger.dev/sdk/v3';

/** Schedule a unique expiry check. Lazy request-time expiry remains the fallback. */
export async function scheduleDonationExpiry(donationId: string, deadline: string): Promise<boolean> {
  if (!process.env.TRIGGER_SECRET_KEY) return false;
  try {
    await tasks.trigger(
      'expire-donation',
      { donationId },
      { delay: new Date(deadline), idempotencyKey: `expire-donation:${donationId}`, idempotencyKeyTTL: '24h' },
    );
    return true;
  } catch (error) {
    console.error('Non-blocking Trigger.dev schedule failed:', error);
    return false;
  }
}
