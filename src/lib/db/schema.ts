// Drizzle ORM Schema (PRD Section 16)
import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  smallint,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'DONOR',
  'RECEIVER',
  'VOLUNTEER',
  'ADMIN',
]);

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'SUSPENDED']);

export const receiverTypeEnum = pgEnum('receiver_type', [
  'NGO',
  'COMMUNITY_KITCHEN',
  'SHELTER',
]);

export const dietPolicyEnum = pgEnum('diet_policy', ['ANY', 'VEG_ONLY']);
export const dietTypeEnum = pgEnum('diet_type', ['VEG', 'NON_VEG']);

export const foodCategoryEnum = pgEnum('food_category', [
  'COOKED_MEAL',
  'BAKERY',
  'FRESH_PRODUCE',
  'PACKAGED',
  'OTHER',
]);

export const storageConditionEnum = pgEnum('storage_condition', [
  'HOT_HELD',
  'CHILLED',
  'AMBIENT',
  'FROZEN',
]);

export const allergenStatusEnum = pgEnum('allergen_status', [
  'NONE_DECLARED',
  'DECLARED',
  'UNKNOWN',
]);

export const donationStatusEnum = pgEnum('donation_status', [
  'POSTED',
  'CLAIMED',
  'COLLECTED',
  'DELIVERED',
  'EXPIRED',
  'CANCELLED',
]);

export const claimStatusEnum = pgEnum('claim_status', [
  'ACTIVE',
  'RELEASED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]);

export const collectorTypeEnum = pgEnum('collector_type', [
  'VOLUNTEER',
  'RECEIVER',
]);

export const pickupStatusEnum = pgEnum('pickup_status', [
  'UNASSIGNED',
  'ASSIGNED',
  'ACCEPTED',
  'COLLECTED',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
]);

export const failureReasonEnum = pgEnum('failure_reason', [
  'DONOR_UNAVAILABLE',
  'RECEIVER_UNAVAILABLE',
  'VOLUNTEER_UNAVAILABLE',
  'FOOD_UNSUITABLE',
  'OTHER',
]);

// 1. users
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').notNull().unique(),
    role: userRoleEnum('role').notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    displayName: text('display_name').notNull(),
    onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_clerk_id_idx').on(table.clerkUserId),
    index('users_role_status_idx').on(table.role, table.status),
  ]
);

// 2. donor_profiles
export const donorProfiles = pgTable('donor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  businessName: text('business_name').notNull(),
  zoneCode: text('zone_code').notNull(),
  latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
  defaultInstructions: text('default_instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. receiver_profiles
export const receiverProfiles = pgTable('receiver_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationName: text('organization_name').notNull(),
  receiverType: receiverTypeEnum('receiver_type').notNull(),
  zoneCode: text('zone_code').notNull(),
  latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
  dailyCapacityKg: numeric('daily_capacity_kg', { precision: 7, scale: 1 }).notNull(),
  dietPolicy: dietPolicyEnum('diet_policy').default('ANY').notNull(),
  avoidAllergens: text('avoid_allergens').array().default(sql`'{}'::text[]`).notNull(),
  preferredCategories: text('preferred_categories').array().default(sql`'{}'::text[]`).notNull(),
  needLevel: smallint('need_level').notNull(), // 1 to 5
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. volunteer_profiles
export const volunteerProfiles = pgTable('volunteer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  zoneCode: text('zone_code').notNull(),
  latitude: numeric('latitude', { precision: 9, scale: 6 }).notNull(),
  longitude: numeric('longitude', { precision: 9, scale: 6 }).notNull(),
  availabilityNote: text('availability_note'),
  maxActivePickups: smallint('max_active_pickups').default(2).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. donations
export const donations = pgTable(
  'donations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donorId: uuid('donor_id')
      .notNull()
      .references(() => donorProfiles.id),
    title: text('title').notNull(),
    category: foodCategoryEnum('category').notNull(),
    dietType: dietTypeEnum('diet_type').notNull(),
    quantityKg: numeric('quantity_kg', { precision: 6, scale: 1 }).notNull(),
    estimatedServings: integer('estimated_servings').notNull(),
    preparedAt: timestamp('prepared_at', { withTimezone: true }),
    pickupDeadline: timestamp('pickup_deadline', { withTimezone: true }).notNull(),
    storageCondition: storageConditionEnum('storage_condition').notNull(),
    allergenStatus: allergenStatusEnum('allergen_status').notNull(),
    allergens: text('allergens').array().default(sql`'{}'::text[]`).notNull(),
    pickupInstructions: text('pickup_instructions'),
    pickupLatitude: numeric('pickup_latitude', { precision: 9, scale: 6 }).notNull(),
    pickupLongitude: numeric('pickup_longitude', { precision: 9, scale: 6 }).notNull(),
    status: donationStatusEnum('status').default('POSTED').notNull(),
    safetyAckAt: timestamp('safety_ack_at', { withTimezone: true }).notNull(),
    collectedAt: timestamp('collected_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    deliveredLate: boolean('delivered_late').default(false).notNull(),
    cancelReason: text('cancel_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('donations_status_deadline_idx').on(table.status, table.pickupDeadline),
    index('donations_donor_status_idx').on(table.donorId, table.status),
    index('donations_created_at_idx').on(table.createdAt),
  ]
);

// 6. claims
export const claims = pgTable(
  'claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donationId: uuid('donation_id')
      .notNull()
      .references(() => donations.id),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => receiverProfiles.id),
    status: claimStatusEnum('status').default('ACTIVE').notNull(),
    matchScore: numeric('match_score', { precision: 4, scale: 1 }),
    claimedAt: timestamp('claimed_at', { withTimezone: true }).defaultNow().notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closeReason: text('close_reason'),
    receiverSafetyAckAt: timestamp('receiver_safety_ack_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('claims_active_donation_idx')
      .on(table.donationId)
      .where(sql`status = 'ACTIVE'`),
    index('claims_receiver_status_idx').on(table.receiverId, table.status),
  ]
);

// 7. pickups
export const pickups = pgTable(
  'pickups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    claimId: uuid('claim_id')
      .notNull()
      .unique()
      .references(() => claims.id),
    donationId: uuid('donation_id')
      .notNull()
      .references(() => donations.id),
    collectorType: collectorTypeEnum('collector_type'),
    volunteerId: uuid('volunteer_id').references(() => volunteerProfiles.id),
    status: pickupStatusEnum('status').default('UNASSIGNED').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    collectedAt: timestamp('collected_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    failureReason: failureReasonEnum('failure_reason'),
    failureNote: text('failure_note'),
    handoffPin: text('handoff_pin'),
    handoffPinAttempts: smallint('handoff_pin_attempts').default(0).notNull(),
    handoffVerifiedAt: timestamp('handoff_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('pickups_status_idx').on(table.status),
    index('pickups_volunteer_status_idx').on(table.volunteerId, table.status),
    uniqueIndex('pickups_open_donation_idx')
      .on(table.donationId)
      .where(sql`status IN ('UNASSIGNED', 'ASSIGNED', 'ACCEPTED', 'COLLECTED')`),
  ]
);

// 8. matches
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donationId: uuid('donation_id')
      .notNull()
      .references(() => donations.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => receiverProfiles.id, { onDelete: 'cascade' }),
    eligible: boolean('eligible').notNull(),
    rejectionCodes: text('rejection_codes').array().default(sql`'{}'::text[]`).notNull(),
    distanceKm: numeric('distance_km', { precision: 5, scale: 2 }),
    distanceScore: numeric('distance_score', { precision: 4, scale: 1 }),
    quantityScore: numeric('quantity_score', { precision: 4, scale: 1 }),
    timingScore: numeric('timing_score', { precision: 4, scale: 1 }),
    needScore: numeric('need_score', { precision: 4, scale: 1 }),
    finalScore: numeric('final_score', { precision: 4, scale: 1 }),
    explanation: text('explanation').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('matches_donation_receiver_idx').on(
      table.donationId,
      table.receiverId
    ),
    index('matches_receiver_score_idx').on(table.receiverId, table.finalScore),
  ]
);

// 9. status_history
export const statusHistory = pgTable(
  'status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    donationId: uuid('donation_id')
      .notNull()
      .references(() => donations.id),
    pickupId: uuid('pickup_id').references(() => pickups.id),
    fromStatus: donationStatusEnum('from_status'),
    toStatus: donationStatusEnum('to_status').notNull(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    actorRole: text('actor_role').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('status_history_donation_idx').on(table.donationId, table.createdAt),
  ]
);

// 10. impact_settings
export const impactSettings = pgTable('impact_settings', {
  id: smallint('id').primaryKey().default(1),
  gramsPerMeal: integer('grams_per_meal').default(400).notNull(),
  co2eKgPerKgFood: numeric('co2e_kg_per_kg_food', { precision: 4, scale: 2 }),
  co2eSourceNote: text('co2e_source_note'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
