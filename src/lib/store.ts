// SAVORUNE Authoritative Data Store & Business Logic Layer (PRD Section 13, 15, 16)
import {
  User,
  DonorProfile,
  ReceiverProfile,
  VolunteerProfile,
  Donation,
  Claim,
  Pickup,
  StatusHistory,
  ImpactSettings,
  ImpactTotals,
  ImpactTrendItem,
  DonorRankingItem,
  UserRole,
  Allergen,
  FoodCategory,
  StorageCondition,
  AllergenStatus,
  DietType,
} from './types';
import {
  SYNTHETIC_ZONES,
  HANDOFF_PIN_LENGTH,
  HANDOFF_PIN_MAX_ATTEMPTS,
  MAX_ACTIVE_PICKUPS_PER_VOLUNTEER,
  RECOVERY_MIN_REMAINING_MIN,
} from './constants';
import { computeMatchForReceiver, calculateHaversineDistanceKm } from './matching';
import { getUrgency } from './urgency';
import fs from 'fs';
import path from 'path';
import { randomInt, randomUUID } from 'crypto';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'savorune-db.json');

export interface StoreState {
  users: User[];
  donorProfiles: DonorProfile[];
  receiverProfiles: ReceiverProfile[];
  volunteerProfiles: VolunteerProfile[];
  donations: Donation[];
  claims: Claim[];
  pickups: Pickup[];
  statusHistory: StatusHistory[];
  impactSettings: ImpactSettings;
}

function generateId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function generatePin(): string {
  return randomInt(100000, 1000000).toString();
}

// Initial Clean Database State
function createInitialState(): StoreState {
  const now = new Date();
  return {
    users: [],
    donorProfiles: [],
    receiverProfiles: [],
    volunteerProfiles: [],
    donations: [],
    claims: [],
    pickups: [],
    statusHistory: [],
    impactSettings: {
      id: 1,
      gramsPerMeal: 400,
      // Environmental accounting stays disabled until an administrator enters
      // a cited factor. The PRD explicitly forbids presenting an invented
      // default as verified impact.
      co2eKgPerKgFood: null,
      co2eSourceNote: null,
      updatedBy: null,
      updatedAt: now.toISOString(),
    },
  };
}

// Store Singleton
class Store {
  private state: StoreState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): StoreState {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.donations) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read database from disk, initializing seed:', e);
    }
    const initial = createInitialState();
    this.saveToDisk(initial);
    return initial;
  }

  public persist(): void {
    this.saveToDisk(this.state);
  }

  private saveToDisk(state: StoreState): void {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Replace the snapshot atomically so an interrupted write cannot leave a
      // partially valid JSON document behind.
      const temporaryPath = `${DB_FILE_PATH}.${process.pid}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(temporaryPath, DB_FILE_PATH);
    } catch (e) {
      console.error('Failed to write database to disk:', e);
    }
  }

  public reset(): void {
    this.state = createInitialState();
    this.persist();
  }

  // Sweep lazy expiry across donations (BL-07)
  private sweepExpiries(now: Date = new Date()): void {
    for (const donation of this.state.donations) {
      if (
        (donation.status === 'POSTED' || donation.status === 'CLAIMED') &&
        new Date(donation.pickupDeadline).getTime() <= now.getTime()
      ) {
        const prevStatus = donation.status;
        donation.status = 'EXPIRED';
        donation.updatedAt = now.toISOString();

        // Close associated open claim/pickup
        const activeClaim = this.state.claims.find(
          (c) => c.donationId === donation.id && c.status === 'ACTIVE'
        );
        if (activeClaim) {
          activeClaim.status = 'EXPIRED';
          activeClaim.closedAt = now.toISOString();
          activeClaim.closeReason = 'DONATION_EXPIRED';
        }

        const openPickup = this.state.pickups.find(
          (p) =>
            p.donationId === donation.id &&
            ['UNASSIGNED', 'ASSIGNED', 'ACCEPTED'].includes(p.status)
        );
        if (openPickup) {
          openPickup.status = 'CANCELLED';
          openPickup.failureReason = 'OTHER';
          openPickup.failureNote = 'Collection deadline passed';
          openPickup.handoffPin = null;
          openPickup.updatedAt = now.toISOString();
        }

        this.state.statusHistory.push({
          id: generateId('hist'),
          donationId: donation.id,
          pickupId: openPickup ? openPickup.id : null,
          fromStatus: prevStatus,
          toStatus: 'EXPIRED',
          actorUserId: null,
          actorRole: 'SYSTEM',
          note: 'Expired: pickup deadline passed',
          createdAt: now.toISOString(),
        });
      }
    }
  }

  // Auth & User helpers
  public getUserByClerkId(clerkId: string): User | undefined {
    return this.state.users.find((u) => u.clerkUserId === clerkId);
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getAllUsers(): User[] {
    return [...this.state.users];
  }

  public updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED'): User {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    user.updatedAt = new Date().toISOString();
    this.persist();
    return user;
  }

  public updateUserRole(userId: string, role: UserRole): User {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.role = role;
    user.updatedAt = new Date().toISOString();
    this.persist();
    return user;
  }

  public createOnboardedUser(params: {
    clerkUserId: string;
    role: 'DONOR' | 'RECEIVER' | 'VOLUNTEER';
    displayName: string;
    zoneCode: string;
    donorFields?: { businessName: string; defaultInstructions?: string };
    receiverFields?: {
      organizationName: string;
      receiverType: 'NGO' | 'COMMUNITY_KITCHEN' | 'SHELTER';
      dailyCapacityKg: number;
      dietPolicy: 'ANY' | 'VEG_ONLY';
      avoidAllergens: Allergen[];
      preferredCategories: FoodCategory[];
      needLevel: number;
    };
    volunteerFields?: { availabilityNote?: string };
  }): { user: User; profile: DonorProfile | ReceiverProfile | VolunteerProfile } {
    const now = new Date().toISOString();
    const zone = SYNTHETIC_ZONES.find((z) => z.code === params.zoneCode) || SYNTHETIC_ZONES[0];

    // Check if user already exists
    let user = this.state.users.find((u) => u.clerkUserId === params.clerkUserId);
    if (user) {
      user.role = params.role;
      user.displayName = params.displayName;
      user.onboardedAt = now;
      user.updatedAt = now;
    } else {
      user = {
        id: generateId('user'),
        clerkUserId: params.clerkUserId,
        role: params.role,
        status: 'ACTIVE',
        displayName: params.displayName,
        onboardedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      this.state.users.push(user);
    }

    if (params.role === 'DONOR') {
      const profile: DonorProfile = {
        id: generateId('donor'),
        userId: user.id,
        businessName: params.donorFields?.businessName || params.displayName,
        zoneCode: zone.code,
        latitude: zone.latitude,
        longitude: zone.longitude,
        defaultInstructions: params.donorFields?.defaultInstructions || null,
        createdAt: now,
      };
      this.state.donorProfiles.push(profile);
      this.persist();
      return { user, profile };
    }

    if (params.role === 'RECEIVER') {
      const profile: ReceiverProfile = {
        id: generateId('rec'),
        userId: user.id,
        organizationName: params.receiverFields?.organizationName || params.displayName,
        receiverType: params.receiverFields?.receiverType || 'COMMUNITY_KITCHEN',
        zoneCode: zone.code,
        latitude: zone.latitude,
        longitude: zone.longitude,
        dailyCapacityKg: params.receiverFields?.dailyCapacityKg || 50,
        dietPolicy: params.receiverFields?.dietPolicy || 'ANY',
        avoidAllergens: params.receiverFields?.avoidAllergens || [],
        preferredCategories: params.receiverFields?.preferredCategories || ['COOKED_MEAL'],
        needLevel: params.receiverFields?.needLevel || 3,
        createdAt: now,
      };
      this.state.receiverProfiles.push(profile);
      this.persist();
      return { user, profile };
    }

    // Volunteer
    const profile: VolunteerProfile = {
      id: generateId('vol'),
      userId: user.id,
      displayName: user.displayName,
      zoneCode: zone.code,
      latitude: zone.latitude,
      longitude: zone.longitude,
      availabilityNote: params.volunteerFields?.availabilityNote || null,
      maxActivePickups: MAX_ACTIVE_PICKUPS_PER_VOLUNTEER,
      createdAt: now,
    };
    this.state.volunteerProfiles.push(profile);
    this.persist();
    return { user, profile };
  }

  public getDonorProfileByUserId(userId: string): DonorProfile | undefined {
    return this.state.donorProfiles.find((p) => p.userId === userId);
  }

  public getReceiverProfileByUserId(userId: string): ReceiverProfile | undefined {
    return this.state.receiverProfiles.find((p) => p.userId === userId);
  }

  public getVolunteerProfileByUserId(userId: string): VolunteerProfile | undefined {
    return this.state.volunteerProfiles.find((p) => p.userId === userId);
  }

  // Calculate receiver's remaining daily capacity (FR-E8, Section 14.1)
  public getReceiverRemainingCapacity(receiverId: string, now: Date = new Date()): {
    dailyCapacityKg: number;
    committedTodayKg: number;
    remainingCapacityKg: number;
  } {
    const receiver = this.state.receiverProfiles.find((r) => r.id === receiverId);
    if (!receiver) {
      return { dailyCapacityKg: 0, committedTodayKg: 0, remainingCapacityKg: 0 };
    }

    // Calculate local midnight for CAPACITY_TZ (Asia/Kolkata, UTC+5:30)
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);

    // Sum quantity_kg of ACTIVE or COMPLETED claims since local midnight
    let committedTodayKg = 0;
    for (const claim of this.state.claims) {
      if (
        claim.receiverId === receiverId &&
        (claim.status === 'ACTIVE' || claim.status === 'COMPLETED') &&
        new Date(claim.claimedAt).getTime() >= midnight.getTime()
      ) {
        const donation = this.state.donations.find((d) => d.id === claim.donationId);
        if (donation) {
          committedTodayKg += donation.quantityKg;
        }
      }
    }

    const remainingCapacityKg = Math.max(0, receiver.dailyCapacityKg - committedTodayKg);
    return {
      dailyCapacityKg: receiver.dailyCapacityKg,
      committedTodayKg,
      remainingCapacityKg,
    };
  }

  // Donations CRUD & Matching
  public createDonation(
    donorUserId: string,
    data: {
      title: string;
      category: FoodCategory;
      dietType: DietType;
      quantityKg: number;
      estimatedServings: number;
      preparedAt?: string | null;
      pickupDeadline: string;
      storageCondition: StorageCondition;
      allergenStatus: AllergenStatus;
      allergens: Allergen[];
      pickupInstructions?: string | null;
      safetyAck: boolean;
    }
  ): {
    donation: Donation;
    matchSummary: {
      eligibleReceivers: number;
      bestScore: number | null;
      exclusionSummary?: { reason: string; count: number }[];
    };
  } {
    this.sweepExpiries();
    let donorProfile = this.getDonorProfileByUserId(donorUserId);
    if (!donorProfile) {
      const user = this.getUserById(donorUserId);
      donorProfile = {
        id: generateId('donor'),
        userId: donorUserId,
        businessName: user ? `${user.displayName}'s Kitchen` : 'Community Donor',
        zoneCode: 'H1',
        latitude: 17.4435,
        longitude: 78.3772,
        defaultInstructions: 'Collect at the kitchen back entrance.',
        createdAt: new Date().toISOString(),
      };
      this.state.donorProfiles.push(donorProfile);
      this.persist();
    }
    if (!data.safetyAck) throw new Error('Safety acknowledgment required');

    const now = new Date();
    const donation: Donation = {
      id: generateId('d'),
      donorId: donorProfile.id,
      title: data.title,
      category: data.category,
      dietType: data.dietType,
      quantityKg: data.quantityKg,
      estimatedServings: data.estimatedServings,
      preparedAt: data.preparedAt || null,
      pickupDeadline: data.pickupDeadline,
      storageCondition: data.storageCondition,
      allergenStatus: data.allergenStatus,
      allergens: data.allergens,
      pickupInstructions: data.pickupInstructions || null,
      pickupLatitude: donorProfile.latitude,
      pickupLongitude: donorProfile.longitude,
      status: 'POSTED',
      safetyAckAt: now.toISOString(),
      collectedAt: null,
      deliveredAt: null,
      deliveredLate: false,
      cancelReason: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      donorBusinessName: donorProfile.businessName,
      donorZoneCode: donorProfile.zoneCode,
      urgency: getUrgency(data.pickupDeadline, now) as any,
    };

    this.state.donations.unshift(donation);

    this.state.statusHistory.push({
      id: generateId('hist'),
      donationId: donation.id,
      pickupId: null,
      fromStatus: null,
      toStatus: 'POSTED',
      actorUserId: donorUserId,
      actorRole: 'DONOR',
      note: 'Donation published',
      createdAt: now.toISOString(),
    });

    // Run matching across active receivers to produce match summary (FR-C3, FR-E10)
    let eligibleCount = 0;
    let bestScore: number | null = null;
    const exclusionCounts: Record<string, number> = {};

    for (const receiver of this.state.receiverProfiles) {
      const cap = this.getReceiverRemainingCapacity(receiver.id, now);
      const match = computeMatchForReceiver(donation, receiver, cap.remainingCapacityKg, now);
      if (match.eligible && match.finalScore !== null) {
        eligibleCount++;
        if (bestScore === null || match.finalScore > bestScore) {
          bestScore = match.finalScore;
        }
      } else {
        for (const code of match.rejectionCodes) {
          let label = 'Capacity limit';
          if (code === 'E7_OUT_OF_AREA') label = 'Distance / outside service area';
          else if (code === 'E3_NOT_FEASIBLE') label = 'Timeline too tight for transport';
          else if (code === 'E4_DIET') label = 'Dietary policy conflict';
          else if (code === 'E5_ALLERGEN' || code === 'E6_ALLERGEN_UNKNOWN') label = 'Allergen caution';
          exclusionCounts[label] = (exclusionCounts[label] || 0) + 1;
        }
      }
    }

    const exclusionSummary =
      eligibleCount === 0
        ? Object.entries(exclusionCounts).map(([reason, count]) => ({ reason, count }))
        : undefined;

    this.persist();

    return {
      donation,
      matchSummary: {
        eligibleReceivers: eligibleCount,
        bestScore,
        exclusionSummary,
      },
    };
  }

  public getDonations(params: {
    role?: UserRole;
    userId?: string;
    status?: string;
    category?: string;
    dietary?: string;
    minKg?: number;
    maxKg?: number;
    maxDistanceKm?: number;
    sort?: 'score' | 'deadline' | 'distance' | 'created';
  }): Donation[] {
    this.sweepExpiries();
    const now = new Date();

    let list = this.state.donations.map((d) => {
      const urgency = getUrgency(d.pickupDeadline, now);
      return {
        ...d,
        urgency: urgency === 'EXPIRED' ? undefined : urgency,
      };
    });

    // Role scoping (Section 7.5, 17.2)
    if (params.role === 'DONOR' && params.userId) {
      const donor = this.getDonorProfileByUserId(params.userId);
      if (donor) {
        list = list.filter((d) => d.donorId === donor.id);
      }
    } else if (params.role === 'RECEIVER') {
      // Receivers see POSTED donations (available) + their own claimed ones
      list = list.filter((d) => d.status === 'POSTED');
    }

    // Filter by status
    if (params.status && params.status !== 'ALL') {
      list = list.filter((d) => d.status === params.status);
    }

    // Category
    if (params.category && params.category !== 'ALL') {
      list = list.filter((d) => d.category === params.category);
    }

    // Dietary
    if (params.dietary === 'VEG_ONLY') {
      list = list.filter((d) => d.dietType === 'VEG');
    }

    // Quantity range
    if (params.minKg !== undefined) {
      list = list.filter((d) => d.quantityKg >= params.minKg!);
    }
    if (params.maxKg !== undefined) {
      list = list.filter((d) => d.quantityKg <= params.maxKg!);
    }

    // Sorting
    if (params.sort === 'deadline') {
      list.sort(
        (a, b) =>
          new Date(a.pickupDeadline).getTime() - new Date(b.pickupDeadline).getTime()
      );
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return list;
  }

  public getDonationById(
    id: string,
    caller?: { role: UserRole; userId: string }
  ): {
    donation: Donation;
    history: StatusHistory[];
    activeClaim?: Claim;
    activePickup?: Pickup;
    revealedPin?: string | null;
  } | undefined {
    this.sweepExpiries();
    const donation = this.state.donations.find((d) => d.id === id);
    if (!donation) return undefined;

    const history = this.state.statusHistory
      .filter((h) => h.donationId === id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const activeClaim = this.state.claims.find(
      (c) => c.donationId === id && c.status === 'ACTIVE'
    );
    const activePickup = this.state.pickups.find(
      (p) =>
        p.donationId === id &&
        ['UNASSIGNED', 'ASSIGNED', 'ACCEPTED', 'COLLECTED'].includes(p.status)
    );

    // PIN projection rule (BL-16): Only owning DONOR and ADMIN can view PIN while pickup is open
    let revealedPin: string | null = null;
    if (activePickup?.handoffPin && caller) {
      const donor = this.getDonorProfileByUserId(caller.userId);
      const isOwner = donor && donor.id === donation.donorId;
      const isAdmin = caller.role === 'ADMIN';
      if (isOwner || isAdmin) {
        revealedPin = activePickup.handoffPin;
      }
    }

    return {
      donation: {
        ...donation,
        urgency: getUrgency(donation.pickupDeadline) as any,
        handoffPin: revealedPin,
      },
      history,
      activeClaim,
      activePickup,
      revealedPin,
    };
  }

  public cancelDonation(
    donationId: string,
    reason: string,
    callerUserId: string
  ): Donation {
    this.sweepExpiries();
    const donation = this.state.donations.find((d) => d.id === donationId);
    if (!donation) throw new Error('Donation not found');

    const caller = this.getUserById(callerUserId);
    const callerDonor = this.getDonorProfileByUserId(callerUserId);
    const ownsDonation = callerDonor?.id === donation.donorId;
    if (!caller || (caller.role !== 'ADMIN' && !ownsDonation)) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Only the donor who posted this surplus or an administrator can cancel it.',
      };
    }

    if (donation.status === 'COLLECTED' || donation.status === 'DELIVERED') {
      throw new Error('Cannot cancel a donation that has already been collected or delivered');
    }

    const prevStatus = donation.status;
    const now = new Date().toISOString();
    donation.status = 'CANCELLED';
    donation.cancelReason = reason;
    donation.updatedAt = now;

    // Close any active claim and pickup
    const claim = this.state.claims.find(
      (c) => c.donationId === donationId && c.status === 'ACTIVE'
    );
    if (claim) {
      claim.status = 'CANCELLED';
      claim.closedAt = now;
      claim.closeReason = reason;
    }

    const pickup = this.state.pickups.find(
      (p) =>
        p.donationId === donationId &&
        ['UNASSIGNED', 'ASSIGNED', 'ACCEPTED'].includes(p.status)
    );
    if (pickup) {
      pickup.status = 'CANCELLED';
      pickup.failureReason = 'DONOR_UNAVAILABLE';
      pickup.failureNote = reason;
      pickup.handoffPin = null;
      pickup.updatedAt = now;
    }

    this.state.statusHistory.push({
      id: generateId('hist'),
      donationId,
      pickupId: pickup?.id || null,
      fromStatus: prevStatus,
      toStatus: 'CANCELLED',
      actorUserId: callerUserId,
      actorRole: caller.role,
      note: `Cancelled: ${reason}`,
      createdAt: now,
    });

    this.persist();
    return donation;
  }

  // Claim Workflow (FR-D6, FR-F2, Section 16.4)
  public claimDonation(
    donationId: string,
    receiverUserId: string,
    safetyAck: boolean
  ): { claim: Claim; pickup: Pickup; donation: Donation } {
    this.sweepExpiries();
    if (!safetyAck) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'Safety acknowledgment required' };
    }

    const receiver = this.getReceiverProfileByUserId(receiverUserId);
    if (!receiver) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Receiver profile not found' };
    }

    const donation = this.state.donations.find((d) => d.id === donationId);
    if (!donation) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Donation not found' };
    }

    // Atomic conditional check: must be POSTED and deadline > now
    const now = new Date();
    if (donation.status !== 'POSTED') {
      throw {
        status: 409,
        code: 'ALREADY_CLAIMED',
        message: 'This donation has already been claimed by another receiver.',
      };
    }
    if (new Date(donation.pickupDeadline).getTime() <= now.getTime()) {
      throw {
        status: 409,
        code: 'DONATION_EXPIRED',
        message: 'The pickup deadline for this donation has already passed.',
      };
    }

    // Recompute capacity under serialized check (FR-E8)
    const cap = this.getReceiverRemainingCapacity(receiver.id, now);
    if (donation.quantityKg > cap.remainingCapacityKg) {
      throw {
        status: 422,
        code: 'NOT_ELIGIBLE',
        message: `Needs ${donation.quantityKg} kg but your remaining capacity today is ${cap.remainingCapacityKg} kg.`,
        details: {
          reasons: [
            {
              code: 'E2_CAPACITY',
              message: `Requested ${donation.quantityKg} kg exceeds remaining capacity of ${cap.remainingCapacityKg} kg (daily limit: ${receiver.dailyCapacityKg} kg).`,
              requestedKg: donation.quantityKg,
              remainingKg: cap.remainingCapacityKg,
            },
          ],
        },
      };
    }

    // Recompute the complete eligibility decision at claim time while the
    // donation is still POSTED. This is the authoritative server-side gate,
    // not merely a UI recommendation check.
    const match = computeMatchForReceiver(donation, receiver, cap.remainingCapacityKg, now);
    if (!match.eligible) {
      throw {
        status: 422,
        code: 'NOT_ELIGIBLE',
        message: 'This donation is no longer eligible for your organization.',
        details: {
          reasons: match.rejectionCodes.map((code) => ({ code })),
          explanation: match.explanation,
        },
      };
    }

    // Apply Transition only after all eligibility checks have passed.
    donation.status = 'CLAIMED';
    donation.updatedAt = now.toISOString();

    const claim: Claim = {
      id: generateId('claim'),
      donationId,
      receiverId: receiver.id,
      status: 'ACTIVE',
      matchScore: match.finalScore,
      claimedAt: now.toISOString(),
      closedAt: null,
      closeReason: null,
      receiverSafetyAckAt: now.toISOString(), // database clock (BL-21)
      receiverName: receiver.organizationName,
    };
    this.state.claims.push(claim);

    // Create Pickup with UNASSIGNED and collector_type unset (null) (FR-F4, A17)
    const handoffPin = generatePin();
    const pickup: Pickup = {
      id: generateId('pickup'),
      claimId: claim.id,
      donationId,
      collectorType: null, // unset until receiver chooses
      volunteerId: null,
      status: 'UNASSIGNED',
      acceptedAt: null,
      collectedAt: null,
      deliveredAt: null,
      failureReason: null,
      failureNote: null,
      handoffPin,
      handoffPinAttempts: 0,
      handoffVerifiedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      donation,
      receiverName: receiver.organizationName,
    };
    this.state.pickups.push(pickup);

    this.state.statusHistory.push({
      id: generateId('hist'),
      donationId,
      pickupId: pickup.id,
      fromStatus: 'POSTED',
      toStatus: 'CLAIMED',
      actorUserId: receiverUserId,
      actorRole: 'RECEIVER',
      note: `Claimed by ${receiver.organizationName}`,
      createdAt: now.toISOString(),
    });

    this.persist();
    return { claim, pickup, donation };
  }

  // Collector selection & Volunteer Acceptance (FR-F4, FR-F5, Section 15.3, 16.4)
  public assignPickup(
    pickupId: string,
    action: 'SELF_COLLECT' | 'OPEN_TO_VOLUNTEERS' | 'ACCEPT' | 'WITHDRAW',
    callerUserId: string,
    params?: { reason?: string; note?: string }
  ): Pickup {
    this.sweepExpiries();
    const pickup = this.state.pickups.find((p) => p.id === pickupId);
    if (!pickup) throw { status: 404, code: 'NOT_FOUND', message: 'Pickup not found' };

    const donation = this.state.donations.find((d) => d.id === pickup.donationId);
    if (!donation) throw { status: 404, code: 'NOT_FOUND', message: 'Donation not found' };

    const now = new Date();

    if (action === 'SELF_COLLECT') {
      // Must be claimant receiver, pickup UNASSIGNED, collectorType not yet chosen
      const receiver = this.getReceiverProfileByUserId(callerUserId);
      const claim = this.state.claims.find((c) => c.id === pickup.claimId);
      if (!receiver || !claim || claim.receiverId !== receiver.id) {
        throw { status: 403, code: 'FORBIDDEN', message: 'Only claimant receiver can choose self-collect' };
      }
      if (pickup.status !== 'UNASSIGNED') {
        throw { status: 409, code: 'INVALID_TRANSITION', message: 'Pickup is already assigned' };
      }

      pickup.collectorType = 'RECEIVER';
      pickup.status = 'ACCEPTED';
      pickup.acceptedAt = now.toISOString();
      pickup.updatedAt = now.toISOString();

      this.state.statusHistory.push({
        id: generateId('hist'),
        donationId: donation.id,
        pickupId: pickup.id,
        fromStatus: 'CLAIMED',
        toStatus: 'CLAIMED',
        actorUserId: callerUserId,
        actorRole: 'RECEIVER',
        note: 'PICKUP_ACCEPTED: Receiver representative will self-collect',
        createdAt: now.toISOString(),
      });

      this.persist();
      return pickup;
    }

    if (action === 'OPEN_TO_VOLUNTEERS') {
      const receiver = this.getReceiverProfileByUserId(callerUserId);
      const claim = this.state.claims.find((c) => c.id === pickup.claimId);
      if (!receiver || !claim || claim.receiverId !== receiver.id) {
        throw { status: 403, code: 'FORBIDDEN', message: 'Only claimant receiver can open pickup to volunteers' };
      }
      if (pickup.status !== 'UNASSIGNED') {
        throw { status: 409, code: 'INVALID_TRANSITION', message: 'Pickup already has a collector' };
      }

      pickup.collectorType = 'VOLUNTEER';
      pickup.updatedAt = now.toISOString();
      this.persist();
      return pickup;
    }

    if (action === 'ACCEPT') {
      // Volunteer accepts open pickup
      const volunteer = this.getVolunteerProfileByUserId(callerUserId);
      if (!volunteer) {
        throw { status: 403, code: 'FORBIDDEN', message: 'Volunteer profile not found' };
      }
      if (pickup.collectorType !== 'VOLUNTEER' || pickup.status !== 'UNASSIGNED') {
        throw {
          status: 409,
          code: 'INVALID_TRANSITION',
          message: 'Pickup is not open for volunteer acceptance.',
        };
      }
      if (new Date(donation.pickupDeadline).getTime() <= now.getTime()) {
        throw { status: 409, code: 'DONATION_EXPIRED', message: 'Donation collection deadline has passed' };
      }

      // Check volunteer active pickups limit under lock (BL-11, Section 16.4)
      const activeCount = this.state.pickups.filter(
        (p) =>
          p.volunteerId === volunteer.id &&
          ['ACCEPTED', 'COLLECTED'].includes(p.status)
      ).length;

      if (activeCount >= volunteer.maxActivePickups) {
        throw {
          status: 409,
          code: 'VOLUNTEER_BUSY',
          message: `You currently have ${activeCount} active pickups (maximum limit is ${volunteer.maxActivePickups}). Complete or deliver those first.`,
        };
      }

      pickup.volunteerId = volunteer.id;
      pickup.status = 'ACCEPTED';
      pickup.acceptedAt = now.toISOString();
      pickup.volunteerName = volunteer.displayName;
      pickup.updatedAt = now.toISOString();

      this.state.statusHistory.push({
        id: generateId('hist'),
        donationId: donation.id,
        pickupId: pickup.id,
        fromStatus: 'CLAIMED',
        toStatus: 'CLAIMED',
        actorUserId: callerUserId,
        actorRole: 'VOLUNTEER',
        note: `PICKUP_ACCEPTED: Volunteer ${volunteer.displayName} accepted assignment`,
        createdAt: now.toISOString(),
      });

      this.persist();
      return pickup;
    }

    if (action === 'WITHDRAW') {
      // Assigned volunteer withdraws before collection
      const volunteer = this.getVolunteerProfileByUserId(callerUserId);
      if (!volunteer || pickup.volunteerId !== volunteer.id) {
        throw { status: 403, code: 'FORBIDDEN', message: 'Only assigned volunteer can withdraw' };
      }
      if (pickup.status !== 'ACCEPTED') {
        throw { status: 409, code: 'INVALID_TRANSITION', message: 'Cannot withdraw after collection' };
      }

      pickup.volunteerId = null;
      pickup.status = 'UNASSIGNED';
      pickup.volunteerName = undefined;
      pickup.handoffPin = generatePin(); // rotate PIN (BL-16)
      pickup.updatedAt = now.toISOString();

      this.state.statusHistory.push({
        id: generateId('hist'),
        donationId: donation.id,
        pickupId: pickup.id,
        fromStatus: 'CLAIMED',
        toStatus: 'CLAIMED',
        actorUserId: callerUserId,
        actorRole: 'VOLUNTEER',
        note: `VOLUNTEER_WITHDREW: ${params?.reason || 'Volunteer withdrew before collection'}`,
        createdAt: now.toISOString(),
      });

      this.persist();
      return pickup;
    }

    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid action' };
  }

  // Pickup Status Transitions (COLLECTED, DELIVERED, FAILED, CANCELLED)
  public updatePickupStatus(
    pickupId: string,
    targetStatus: 'COLLECTED' | 'DELIVERED' | 'FAILED' | 'CANCELLED',
    callerUserId: string,
    params?: {
      handoffPin?: string;
      failureReason?: any;
      note?: string;
      isAdminOverride?: boolean;
    }
  ): { pickup: Pickup; donation: Donation; outcome?: string } {
    this.sweepExpiries();
    const pickup = this.state.pickups.find((p) => p.id === pickupId);
    if (!pickup) throw { status: 404, code: 'NOT_FOUND', message: 'Pickup not found' };

    const donation = this.state.donations.find((d) => d.id === pickup.donationId);
    if (!donation) throw { status: 404, code: 'NOT_FOUND', message: 'Donation not found' };

    const claim = this.state.claims.find((c) => c.id === pickup.claimId);
    const now = new Date();
    const caller = this.state.users.find((u) => u.id === callerUserId);
    const callerVolunteer = this.getVolunteerProfileByUserId(callerUserId);
    const callerReceiver = this.getReceiverProfileByUserId(callerUserId);
    const isAdmin = caller?.role === 'ADMIN';
    const isAssignedVolunteer = Boolean(callerVolunteer && pickup.volunteerId === callerVolunteer.id);
    const isClaimantReceiver = Boolean(callerReceiver && claim?.receiverId === callerReceiver.id);
    const isReceiverCollector = pickup.collectorType === 'RECEIVER' && isClaimantReceiver;

    // Status endpoints are authenticated, but ownership must be enforced at the
    // domain boundary as well. This prevents any signed-in user from advancing
    // or cancelling somebody else's pickup by guessing its id.
    if (
      (targetStatus === 'COLLECTED' || targetStatus === 'DELIVERED') &&
      !isAdmin && !isAssignedVolunteer && !isReceiverCollector
    ) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Only the assigned collector can update this pickup.' };
    }
    if (
      (targetStatus === 'FAILED' || targetStatus === 'CANCELLED') &&
      !isAdmin && !isAssignedVolunteer && !isClaimantReceiver
    ) {
      throw { status: 403, code: 'FORBIDDEN', message: 'Only the claimant, assigned volunteer, or an administrator can close this pickup.' };
    }

    if (targetStatus === 'COLLECTED') {
      if (pickup.status !== 'ACCEPTED') {
        throw { status: 409, code: 'INVALID_TRANSITION', message: 'Pickup is not in ACCEPTED state' };
      }
      if (new Date(donation.pickupDeadline).getTime() <= now.getTime()) {
        // Deadline passed -> expire donation and clear PIN (BL-06, AC-36)
        donation.status = 'EXPIRED';
        pickup.status = 'CANCELLED';
        pickup.handoffPin = null;
        this.persist();
        throw { status: 409, code: 'DONATION_EXPIRED', message: 'Collection deadline has passed' };
      }

      // Check Handoff PIN if present and not admin override
      if (pickup.handoffPin && !params?.isAdminOverride) {
        if (pickup.handoffPinAttempts >= HANDOFF_PIN_MAX_ATTEMPTS) {
          throw {
            status: 429,
            code: 'HANDOFF_PIN_LOCKED',
            message: 'Too many incorrect PIN attempts. Handoff is locked. Please request an admin override.',
          };
        }

        if (!params?.handoffPin || params.handoffPin !== pickup.handoffPin) {
          pickup.handoffPinAttempts++;
          const remaining = Math.max(0, HANDOFF_PIN_MAX_ATTEMPTS - pickup.handoffPinAttempts);
          this.persist();
          if (pickup.handoffPinAttempts >= HANDOFF_PIN_MAX_ATTEMPTS) {
            throw {
              status: 429,
              code: 'HANDOFF_PIN_LOCKED',
              message: 'Maximum incorrect PIN attempts reached. Handoff locked.',
            };
          }
          throw {
            status: 422,
            code: 'HANDOFF_PIN_INVALID',
            message: `Incorrect 6-digit handoff PIN. ${remaining} attempts remaining.`,
            details: { attemptsRemaining: remaining },
          };
        }

        pickup.handoffVerifiedAt = now.toISOString();
        pickup.handoffPin = null; // cleared on success (BL-16)
      }

      pickup.status = 'COLLECTED';
      pickup.collectedAt = now.toISOString();
      pickup.updatedAt = now.toISOString();

      donation.status = 'COLLECTED';
      donation.collectedAt = now.toISOString();
      donation.updatedAt = now.toISOString();

      this.state.statusHistory.push({
        id: generateId('hist'),
        donationId: donation.id,
        pickupId: pickup.id,
        fromStatus: 'CLAIMED',
        toStatus: 'COLLECTED',
        actorUserId: callerUserId,
        actorRole: caller?.role || 'VOLUNTEER',
        note: params?.isAdminOverride
          ? 'PIN_OVERRIDE: Admin confirmed collection without PIN'
          : 'HANDOFF_PIN_VERIFIED: Collector verified handoff PIN and collected surplus',
        createdAt: now.toISOString(),
      });
      this.persist();
      return { pickup, donation };
    }

    if (targetStatus === 'DELIVERED') {
      if (pickup.status !== 'COLLECTED') {
        throw { status: 409, code: 'INVALID_TRANSITION', message: 'Pickup must be COLLECTED before delivery' };
      }

      const isLate = now.getTime() > new Date(donation.pickupDeadline).getTime();

      pickup.status = 'DELIVERED';
      pickup.deliveredAt = now.toISOString();
      pickup.updatedAt = now.toISOString();

      donation.status = 'DELIVERED';
      donation.deliveredAt = now.toISOString();
      donation.deliveredLate = isLate;
      donation.updatedAt = now.toISOString();

      if (claim) {
        claim.status = 'COMPLETED';
        claim.closedAt = now.toISOString();
        claim.closeReason = 'DELIVERED';
      }

      this.state.statusHistory.push({
        id: generateId('hist'),
        donationId: donation.id,
        pickupId: pickup.id,
        fromStatus: 'COLLECTED',
        toStatus: 'DELIVERED',
        actorUserId: callerUserId,
        actorRole: caller?.role || 'VOLUNTEER',
        note: `Delivered to receiver${isLate ? ' (Late delivery)' : ''}`,
        createdAt: now.toISOString(),
      });
      this.persist();
      return { pickup, donation };
    }

    if (targetStatus === 'FAILED' || targetStatus === 'CANCELLED') {
      if (pickup.status === 'COLLECTED' || pickup.status === 'DELIVERED') {
        throw { status: 409, code: 'INVALID_TRANSITION', message: 'Cannot cancel or fail after collection' };
      }

      const diffMin = (new Date(donation.pickupDeadline).getTime() - now.getTime()) / (1000 * 60);
      let outcome = 'RELEASED_TO_POSTED';

      pickup.status = targetStatus === 'FAILED' ? 'FAILED' : 'CANCELLED';
      pickup.failureReason = params?.failureReason || 'OTHER';
      pickup.failureNote = params?.note || null;
      pickup.handoffPin = null;
      pickup.updatedAt = now.toISOString();

      if (params?.failureReason === 'FOOD_UNSUITABLE') {
        donation.status = 'CANCELLED';
        donation.cancelReason = 'Reported food unsuitable';
        outcome = 'CANCELLED';
      } else if (diffMin < RECOVERY_MIN_REMAINING_MIN) {
        donation.status = 'EXPIRED';
        outcome = 'EXPIRED';
      } else {
        // At least 30 minutes remain -> re-offer to POSTED!
        donation.status = 'POSTED';
        outcome = 'RELEASED_TO_POSTED';
      }
      donation.updatedAt = now.toISOString();

      if (claim) {
        claim.status = outcome === 'RELEASED_TO_POSTED' ? 'RELEASED' : 'CANCELLED';
        claim.closedAt = now.toISOString();
        claim.closeReason = params?.note || params?.failureReason;
      }

      this.state.statusHistory.push({
        id: generateId('hist'),
        donationId: donation.id,
        pickupId: pickup.id,
        fromStatus: 'CLAIMED',
        toStatus: donation.status,
        actorUserId: callerUserId,
        actorRole: caller?.role || 'RECEIVER',
        note: `${targetStatus}: ${params?.note || params?.failureReason}. Outcome: ${outcome}`,
        createdAt: now.toISOString(),
      });
      this.persist();
      return { pickup, donation, outcome };
    }

    throw { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid target status' };
  }

  // Open Pickups for Volunteers (FR-E7, FR-F13)
  public getPickups(params: {
    scope?: 'open' | 'mine' | 'all';
    volunteerUserId?: string;
    receiverUserId?: string;
  }): Pickup[] {
    this.sweepExpiries();
    const now = new Date();

    let list = this.state.pickups.map((p) => {
      const d = this.state.donations.find((d) => d.id === p.donationId);
      return {
        ...p,
        donation: d
          ? {
              ...d,
              urgency: getUrgency(d.pickupDeadline, now) as any,
              handoffPin: null, // never in listing (BL-16)
            }
          : undefined,
      };
    });

    if (params.scope === 'open') {
      // Pickups opened to volunteers, status UNASSIGNED
      list = list.filter(
        (p) => p.collectorType === 'VOLUNTEER' && p.status === 'UNASSIGNED'
      );

      // Sort by distance from volunteer base zone
      if (params.volunteerUserId) {
        const vol = this.getVolunteerProfileByUserId(params.volunteerUserId);
        if (vol) {
          list.sort((a, b) => {
            const distA = a.donation
              ? calculateHaversineDistanceKm(vol.latitude, vol.longitude, a.donation.pickupLatitude, a.donation.pickupLongitude)
              : 999;
            const distB = b.donation
              ? calculateHaversineDistanceKm(vol.latitude, vol.longitude, b.donation.pickupLatitude, b.donation.pickupLongitude)
              : 999;
            return distA - distB;
          });
        }
      }
    } else if (params.scope === 'mine' && params.volunteerUserId) {
      const vol = this.getVolunteerProfileByUserId(params.volunteerUserId);
      if (vol) {
        list = list.filter((p) => p.volunteerId === vol.id);
      }
    } else if (params.receiverUserId) {
      const rec = this.getReceiverProfileByUserId(params.receiverUserId);
      if (rec) {
        const myClaims = this.state.claims.filter((c) => c.receiverId === rec.id).map((c) => c.id);
        list = list.filter((p) => myClaims.includes(p.claimId));
      }
    }

    return list;
  }

  // Impact Dashboard Queries (PRD Section 20, FR-G1-G6)
  public getImpactMetrics(scope: 'platform' | 'me' = 'platform', donorUserId?: string): {
    totals: ImpactTotals;
    labels: Record<keyof ImpactTotals, 'RECORDED' | 'ESTIMATE'>;
    units: Record<string, string>;
    trend: ImpactTrendItem[];
    donorRanking: DonorRankingItem[];
    assumptions: {
      gramsPerMeal: number;
      wasteAvoidedBasis: string;
      co2eFactorSource?: string;
    };
    dataOrigin: string;
    disclaimerKey: string;
  } {
    this.sweepExpiries();
    const gramsPerMeal = this.state.impactSettings.gramsPerMeal || 400;

    // Filter DELIVERED donations only (FR-G4, BL-08)
    let deliveredDonations = this.state.donations.filter((d) => d.status === 'DELIVERED');

    if (scope === 'me' && donorUserId) {
      const donor = this.getDonorProfileByUserId(donorUserId);
      if (donor) {
        deliveredDonations = deliveredDonations.filter((d) => d.donorId === donor.id);
      }
    }

    const deliveredCount = deliveredDonations.length;
    const kgRescued = deliveredDonations.reduce((acc, d) => acc + d.quantityKg, 0);
    const mealsSaved = Math.round((kgRescued * 1000) / gramsPerMeal);
    const wasteAvoidedKg = kgRescued;

    const totals: ImpactTotals = {
      deliveredCount,
      kgRescued,
      mealsSaved,
      wasteAvoidedKg,
    };

    if (this.state.impactSettings.co2eKgPerKgFood) {
      totals.co2eKg = Number((kgRescued * this.state.impactSettings.co2eKgPerKgFood).toFixed(1));
    }

    // Trend grouping by delivered date
    const trendMap: Record<string, { kg: number; meals: number; count: number }> = {};
    for (const d of deliveredDonations) {
      const dateKey = d.deliveredAt ? d.deliveredAt.substring(0, 10) : d.createdAt.substring(0, 10);
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { kg: 0, meals: 0, count: 0 };
      }
      trendMap[dateKey].kg += d.quantityKg;
      trendMap[dateKey].count += 1;
      trendMap[dateKey].meals += Math.round((d.quantityKg * 1000) / gramsPerMeal);
    }

    const trend: ImpactTrendItem[] = Object.entries(trendMap).map(([date, val]) => ({
      date,
      kg: Number(val.kg.toFixed(1)),
      meals: val.meals,
      donations: val.count,
    }));

    // Donor rankings
    const donorGroup: Record<string, { name: string; kg: number; count: number }> = {};
    for (const d of deliveredDonations) {
      const donor = this.state.donorProfiles.find((dp) => dp.id === d.donorId);
      const name = donor ? donor.businessName : 'Restaurant Donor';
      if (!donorGroup[d.donorId]) {
        donorGroup[d.donorId] = { name, kg: 0, count: 0 };
      }
      donorGroup[d.donorId].kg += d.quantityKg;
      donorGroup[d.donorId].count += 1;
    }

    const donorRanking: DonorRankingItem[] = Object.entries(donorGroup)
      .map(([donorId, data]) => ({
        donorId,
        businessName: data.name,
        deliveredKg: Number(data.kg.toFixed(1)),
        deliveredCount: data.count,
      }))
      .sort((a, b) => b.deliveredKg - a.deliveredKg);

    return {
      totals,
      labels: {
        deliveredCount: 'RECORDED',
        kgRescued: 'RECORDED',
        mealsSaved: 'ESTIMATE',
        wasteAvoidedKg: 'ESTIMATE',
        co2eKg: 'ESTIMATE',
      },
      units: {
        kgRescued: 'kg',
        mealsSaved: 'meals',
        wasteAvoidedKg: 'kg',
        deliveredCount: 'donations',
        co2eKg: 'kg CO₂e',
      },
      trend,
      donorRanking,
      assumptions: {
        gramsPerMeal,
        wasteAvoidedBasis:
          'Assumes recorded surplus food would otherwise have been discarded as food waste (PRD Assumption A14).',
        co2eFactorSource: this.state.impactSettings.co2eSourceNote || undefined,
      },
      dataOrigin: 'SYNTHETIC_DEMO',
      disclaimerKey: 'SAFETY_DISCLAIMER',
    };
  }

  // Admin Analytics (FR-I5, FR-I9)
  public getAdminAnalytics() {
    this.sweepExpiries();
    const counts = {
      POSTED: this.state.donations.filter((d) => d.status === 'POSTED').length,
      CLAIMED: this.state.donations.filter((d) => d.status === 'CLAIMED').length,
      COLLECTED: this.state.donations.filter((d) => d.status === 'COLLECTED').length,
      DELIVERED: this.state.donations.filter((d) => d.status === 'DELIVERED').length,
      EXPIRED: this.state.donations.filter((d) => d.status === 'EXPIRED').length,
      CANCELLED: this.state.donations.filter((d) => d.status === 'CANCELLED').length,
    };

    const stuckPickups = this.state.pickups.filter((p) => {
      if (p.status !== 'UNASSIGNED' && p.status !== 'ACCEPTED') return false;
      const d = this.state.donations.find((dn) => dn.id === p.donationId);
      if (!d) return false;
      const diffMins = (new Date(d.pickupDeadline).getTime() - Date.now()) / (1000 * 60);
      return diffMins > 0 && diffMins <= 30; // Under 30 minutes left without collection
    });

    const failedPickups = this.state.pickups.filter(
      (p) => p.status === 'FAILED' || p.status === 'CANCELLED'
    );

    return {
      counts,
      activeCount: counts.POSTED + counts.CLAIMED + counts.COLLECTED,
      stuckPickupsCount: stuckPickups.length,
      failedPickupsCount: failedPickups.length,
      usersCount: this.state.users.length,
      donorsCount: this.state.donorProfiles.length,
      receiversCount: this.state.receiverProfiles.length,
      volunteersCount: this.state.volunteerProfiles.length,
      stuckPickups,
      failedPickups,
      impact: this.getImpactMetrics('platform'),
    };
  }

  public updateImpactSettings(settings: Partial<ImpactSettings>): ImpactSettings {
    if (settings.gramsPerMeal !== undefined) {
      this.state.impactSettings.gramsPerMeal = settings.gramsPerMeal;
    }
    if (settings.co2eKgPerKgFood !== undefined) {
      this.state.impactSettings.co2eKgPerKgFood = settings.co2eKgPerKgFood;
    }
    if (settings.co2eSourceNote !== undefined) {
      this.state.impactSettings.co2eSourceNote = settings.co2eSourceNote;
    }
    this.state.impactSettings.updatedAt = new Date().toISOString();
    this.persist();
    return this.state.impactSettings;
  }
}

// Global store instance preserved across hot reloads
const globalForStore = globalThis as unknown as { __savorune_store__?: Store };
export const store = globalForStore.__savorune_store__ || new Store();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__savorune_store__ = store;
}
