import { task } from '@trigger.dev/sdk/v3';

export const expireDonation = task({
  id: 'expire-donation',
  maxDuration: 60,
  retry: { maxAttempts: 3 },
  run: async (payload: { donationId: string }) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const secret = process.env.CRON_SECRET;
    if (!baseUrl || !secret) throw new Error('NEXT_PUBLIC_APP_URL and CRON_SECRET are required');
    const response = await fetch(new URL('/api/internal/expire-donation', baseUrl), {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Expiry callback failed with ${response.status}`);
    return response.json();
  },
});
