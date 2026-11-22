import { after, NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { store } from '@/lib/store';
import { z } from 'zod';
import { notifyCurrentUser } from '@/lib/notifications';
import { scheduleDonationExpiry } from '@/lib/scheduling';

const createDonationSchema = z.object({
  title: z.string().min(3).max(60),
  category: z.enum(['COOKED_MEAL', 'BAKERY', 'FRESH_PRODUCE', 'PACKAGED', 'OTHER']),
  dietType: z.enum(['VEG', 'NON_VEG']),
  quantityKg: z.number().min(0.5).max(500),
  estimatedServings: z.number().int().min(1).max(2000),
  preparedAt: z.string().nullable().optional(),
  pickupDeadline: z.string(),
  storageCondition: z.enum(['HOT_HELD', 'CHILLED', 'AMBIENT', 'FROZEN']),
  allergenStatus: z.enum(['NONE_DECLARED', 'DECLARED', 'UNKNOWN']),
  allergens: z.array(z.enum([
    'PEANUTS', 'TREE_NUTS', 'DAIRY', 'EGG', 'GLUTEN', 'SOY',
    'FISH', 'SHELLFISH', 'SESAME', 'MUSTARD',
  ])).max(10).default([]),
  pickupInstructions: z.string().max(300).nullable().optional(),
  safetyAck: z.literal(true),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentUser();
    if (!ctx) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const dietary = searchParams.get('dietary') || undefined;
    const minKg = searchParams.get('minKg') ? Number(searchParams.get('minKg')) : undefined;
    const maxKg = searchParams.get('maxKg') ? Number(searchParams.get('maxKg')) : undefined;
    const sort = (searchParams.get('sort') as any) || 'created';

    const donations = store.getDonations({
      role: ctx?.user.role,
      userId: ctx?.user.id,
      status,
      category,
      dietary,
      minKg,
      maxKg,
      sort,
    });

    // Exact pickup instructions and coordinates are operational data. They are
    // only returned to a donor for their own listings; receiver discovery uses
    // zone labels until a claim is active (BL-10 / Section 18.1).
    const canSeeOperationalDetails = ctx.user.role === 'DONOR' || ctx.user.role === 'ADMIN';
    const projectedDonations = donations.map((donation) => ({
      ...donation,
      pickupInstructions: canSeeOperationalDetails ? donation.pickupInstructions : null,
      pickupLatitude: canSeeOperationalDetails ? donation.pickupLatitude : null,
      pickupLongitude: canSeeOperationalDetails ? donation.pickupLongitude : null,
      handoffPin: undefined,
    }));

    return NextResponse.json({
      data: projectedDonations,
      meta: {
        total: projectedDonations.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message || 'Failed to list donations' } },
      { status: error.status || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireRole(['DONOR']);
    const body = await req.json();

    const validated = createDonationSchema.parse(body);

    if (validated.allergenStatus === 'DECLARED' && validated.allergens.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Select at least one allergen when allergens are declared.' } },
        { status: 400 }
      );
    }
    if (validated.allergenStatus !== 'DECLARED' && validated.allergens.length > 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Allergen selections are only allowed when status is declared.' } },
        { status: 400 }
      );
    }

    // Validate instructions reject phone numbers & email addresses (BL-13)
    if (validated.pickupInstructions) {
      const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      if (phoneRegex.test(validated.pickupInstructions) || emailRegex.test(validated.pickupInstructions)) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Pickup instructions must not contain personal phone numbers or email addresses.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate deadline between now+30m and now+12h
    const now = Date.now();
    const deadline = new Date(validated.pickupDeadline).getTime();
    if (!Number.isFinite(deadline) || deadline < now + 30 * 60 * 1000 || deadline > now + 12 * 60 * 60 * 1000) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Pickup deadline must be between 30 minutes and 12 hours from now.',
          },
        },
        { status: 400 }
      );
    }

    if (validated.preparedAt) {
      const preparedAt = new Date(validated.preparedAt).getTime();
      if (!Number.isFinite(preparedAt) || preparedAt > now) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Preparation time cannot be in the future.' } },
          { status: 400 }
        );
      }
    }

    const result = store.createDonation(ctx.user.id, {
      ...validated,
      allergens: validated.allergens as any,
    });

    after(async () => {
      await Promise.allSettled([
        notifyCurrentUser({
          subject: `Surplus posted: ${result.donation.title}`,
          title: 'Your surplus is live',
          message: `${result.donation.quantityKg} kg is now available to eligible receivers until the collection deadline.`,
          actionLabel: 'View donation',
          actionPath: `/donations/${result.donation.id}`,
        }),
        scheduleDonationExpiry(result.donation.id, result.donation.pickupDeadline),
      ]);
    });

    return NextResponse.json(
      {
        data: result.donation,
        matchSummary: result.matchSummary,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid donation input.',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: error.code || 'BAD_REQUEST', message: error.message || 'Failed to create donation' } },
      { status: error.status || 400 }
    );
  }
}
