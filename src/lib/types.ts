// SAVORUNE Domain Types (PRD Section 16 & 17)

export type UserRole = 'DONOR' | 'RECEIVER' | 'VOLUNTEER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type ReceiverType = 'NGO' | 'COMMUNITY_KITCHEN' | 'SHELTER';
export type DietPolicy = 'ANY' | 'VEG_ONLY';
export type DietType = 'VEG' | 'NON_VEG';

export type FoodCategory =
  | 'COOKED_MEAL'
  | 'BAKERY'
  | 'FRESH_PRODUCE'
  | 'PACKAGED'
  | 'OTHER';

export type StorageCondition = 'HOT_HELD' | 'CHILLED' | 'AMBIENT' | 'FROZEN';

export type AllergenStatus = 'NONE_DECLARED' | 'DECLARED' | 'UNKNOWN';

export type Allergen =
  | 'PEANUTS'
  | 'TREE_NUTS'
  | 'DAIRY'
  | 'EGG'
  | 'GLUTEN'
  | 'SOY'
  | 'FISH'
  | 'SHELLFISH'
  | 'SESAME'
  | 'MUSTARD';

export type DonationStatus =
  | 'POSTED'
  | 'CLAIMED'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'EXPIRED'
  | 'CANCELLED';

export type ClaimStatus =
  | 'ACTIVE'
  | 'RELEASED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CollectorType = 'VOLUNTEER' | 'RECEIVER';

export type PickupStatus =
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type FailureReason =
  | 'DONOR_UNAVAILABLE'
  | 'RECEIVER_UNAVAILABLE'
  | 'VOLUNTEER_UNAVAILABLE'
  | 'FOOD_UNSUITABLE'
  | 'OTHER';

export type UrgencyLabel = 'URGENT' | 'EXPIRING_SOON' | 'AVAILABLE';

export interface User {
  id: string;
  clerkUserId: string;
  role: UserRole;
  status: UserStatus;
  displayName: string;
  onboardedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonorProfile {
  id: string;
  userId: string;
  businessName: string;
  zoneCode: string;
  latitude: number;
  longitude: number;
  defaultInstructions: string | null;
  createdAt: string;
}

export interface ReceiverProfile {
  id: string;
  userId: string;
  organizationName: string;
  receiverType: ReceiverType;
  zoneCode: string;
  latitude: number;
  longitude: number;
  dailyCapacityKg: number;
  dietPolicy: DietPolicy;
  avoidAllergens: Allergen[];
  preferredCategories: FoodCategory[];
  needLevel: number; // 1-5
  createdAt: string;
}

export interface VolunteerProfile {
  id: string;
  userId: string;
  displayName?: string;
  zoneCode: string;
  latitude: number;
  longitude: number;
  availabilityNote: string | null;
  maxActivePickups: number; // default 2
  createdAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  title: string;
  category: FoodCategory;
  dietType: DietType;
  quantityKg: number;
  estimatedServings: number;
  preparedAt: string | null;
  pickupDeadline: string;
  storageCondition: StorageCondition;
  allergenStatus: AllergenStatus;
  allergens: Allergen[];
  pickupInstructions: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  status: DonationStatus;
  safetyAckAt: string;
  collectedAt: string | null;
  deliveredAt: string | null;
  deliveredLate: boolean;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined fields for display
  donorBusinessName?: string;
  donorZoneCode?: string;
  urgency?: UrgencyLabel;
  handoffPin?: string | null;
}

export interface Claim {
  id: string;
  donationId: string;
  receiverId: string;
  status: ClaimStatus;
  matchScore: number | null;
  claimedAt: string;
  closedAt: string | null;
  closeReason: string | null;
  receiverSafetyAckAt: string;

  // Joined fields
  receiverName?: string;
}

export interface Pickup {
  id: string;
  claimId: string;
  donationId: string;
  collectorType: CollectorType | null;
  volunteerId: string | null;
  status: PickupStatus;
  acceptedAt: string | null;
  collectedAt: string | null;
  deliveredAt: string | null;
  failureReason: FailureReason | null;
  failureNote: string | null;
  handoffPin: string | null;
  handoffPinAttempts: number;
  handoffVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined fields
  volunteerName?: string;
  donation?: Donation;
  receiverName?: string;
}

export interface MatchScoreFactors {
  distance: number;
  quantity: number;
  timing: number;
  need: number;
}

export interface Match {
  id: string;
  donationId: string;
  receiverId: string;
  eligible: boolean;
  rejectionCodes: string[];
  distanceKm: number;
  distanceScore: number;
  quantityScore: number;
  timingScore: number;
  needScore: number;
  finalScore: number | null;
  explanation: string;
  computedAt: string;

  // Enriched
  donation?: Donation;
  receiver?: ReceiverProfile;
}

export interface StatusHistory {
  id: string;
  donationId: string;
  pickupId: string | null;
  fromStatus: DonationStatus | null;
  toStatus: DonationStatus;
  actorUserId: string | null;
  actorRole: string;
  note: string | null;
  createdAt: string;
}

export interface ImpactSettings {
  id: number;
  gramsPerMeal: number;
  co2eKgPerKgFood: number | null;
  co2eSourceNote: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface ImpactTotals {
  deliveredCount: number;
  kgRescued: number;
  mealsSaved: number;
  wasteAvoidedKg: number;
  co2eKg?: number;
}

export interface ImpactTrendItem {
  date: string;
  kg: number;
  meals: number;
  donations: number;
}

export interface DonorRankingItem {
  donorId: string;
  businessName: string;
  deliveredKg: number;
  deliveredCount: number;
}
