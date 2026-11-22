// SAVORUNE Smart Matching Engine (PRD Section 14)
import {
  Donation,
  ReceiverProfile,
  MatchScoreFactors,
  Match,
} from './types';
import {
  MAX_RADIUS_KM,
  D_FULL_KM,
  AVG_SPEED_KMPH,
  HANDLING_BUFFER_MIN,
  SLACK_FULL_MIN,
  QTY_BAND_MIN_RATIO,
  SERVICE_BBOX,
  WEIGHTS,
} from './constants';

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export interface EligibilityResult {
  eligible: boolean;
  rejectionCodes: string[];
  rejectionReasons: string[];
  distanceKm: number;
  minutesToDeadline: number;
}

export function checkEligibility(
  donation: Donation,
  receiver: ReceiverProfile,
  remainingCapacityKg: number,
  now: Date = new Date(),
  donorSuspended: boolean = false,
  receiverSuspended: boolean = false
): EligibilityResult {
  const rejectionCodes: string[] = [];
  const rejectionReasons: string[] = [];

  const deadline = new Date(donation.pickupDeadline).getTime();
  const minutesToDeadline = Math.floor((deadline - now.getTime()) / (1000 * 60));

  // E1_EXPIRED
  if (donation.status !== 'POSTED' || minutesToDeadline <= 0) {
    rejectionCodes.push('E1_EXPIRED');
    rejectionReasons.push('Donation is no longer available or the collection deadline has passed.');
  }

  // E8_SUSPENDED
  if (donorSuspended || receiverSuspended) {
    rejectionCodes.push('E8_SUSPENDED');
    rejectionReasons.push('Account is currently suspended.');
  }

  // Check coordinates and distance
  const isInsideBbox =
    receiver.latitude >= SERVICE_BBOX.minLat &&
    receiver.latitude <= SERVICE_BBOX.maxLat &&
    receiver.longitude >= SERVICE_BBOX.minLng &&
    receiver.longitude <= SERVICE_BBOX.maxLng &&
    donation.pickupLatitude >= SERVICE_BBOX.minLat &&
    donation.pickupLatitude <= SERVICE_BBOX.maxLat &&
    donation.pickupLongitude >= SERVICE_BBOX.minLng &&
    donation.pickupLongitude <= SERVICE_BBOX.maxLng;

  const distanceKm = calculateHaversineDistanceKm(
    donation.pickupLatitude,
    donation.pickupLongitude,
    receiver.latitude,
    receiver.longitude
  );

  // E7_OUT_OF_AREA
  if (!isInsideBbox || distanceKm > MAX_RADIUS_KM) {
    rejectionCodes.push('E7_OUT_OF_AREA');
    rejectionReasons.push(
      `Location is outside the supported service area (${distanceKm.toFixed(1)} km away; max limit is ${MAX_RADIUS_KM} km).`
    );
  }

  // E2_CAPACITY
  if (donation.quantityKg > remainingCapacityKg) {
    rejectionCodes.push('E2_CAPACITY');
    rejectionReasons.push(
      `Needs ${donation.quantityKg} kg but your remaining capacity today is ${remainingCapacityKg.toFixed(1)} kg (of ${receiver.dailyCapacityKg} kg total).`
    );
  }

  // E3_NOT_FEASIBLE
  const travelMinutes = (distanceKm / AVG_SPEED_KMPH) * 60;
  const requiredMinutes = travelMinutes + HANDLING_BUFFER_MIN;
  if (minutesToDeadline < requiredMinutes) {
    rejectionCodes.push('E3_NOT_FEASIBLE');
    rejectionReasons.push(
      `Not enough time for transport and handover (needs ~${Math.ceil(requiredMinutes)} mins, only ${minutesToDeadline} mins left).`
    );
  }

  // E4_DIET
  if (receiver.dietPolicy === 'VEG_ONLY' && donation.dietType === 'NON_VEG') {
    rejectionCodes.push('E4_DIET');
    rejectionReasons.push('Contains non-vegetarian food, which exceeds your vegetarian-only policy.');
  }

  // E5_ALLERGEN
  const allergenConflicts = donation.allergens.filter((a) =>
    receiver.avoidAllergens.includes(a)
  );
  if (allergenConflicts.length > 0) {
    rejectionCodes.push('E5_ALLERGEN');
    rejectionReasons.push(
      `Contains allergens you avoid: ${allergenConflicts.join(', ')}.`
    );
  }

  // E6_ALLERGEN_UNKNOWN
  if (
    donation.allergenStatus === 'UNKNOWN' &&
    receiver.avoidAllergens.length > 0
  ) {
    rejectionCodes.push('E6_ALLERGEN_UNKNOWN');
    rejectionReasons.push(
      'Donation allergen status is unknown while you have declared allergen avoidances.'
    );
  }

  return {
    eligible: rejectionCodes.length === 0,
    rejectionCodes,
    rejectionReasons,
    distanceKm,
    minutesToDeadline,
  };
}

export function scoreMatch(
  donation: Donation,
  receiver: ReceiverProfile,
  remainingCapacityKg: number,
  distanceKm: number,
  minutesToDeadline: number
): {
  factors: MatchScoreFactors;
  finalScore: number;
  explanation: string;
} {
  // 1. Distance factor (0-100)
  let distanceScore = 100;
  if (distanceKm > D_FULL_KM) {
    distanceScore = Math.max(
      0,
      100 * (1 - (distanceKm - D_FULL_KM) / (MAX_RADIUS_KM - D_FULL_KM))
    );
  }

  // 2. Quantity factor (0-100)
  const bandFloor = QTY_BAND_MIN_RATIO * remainingCapacityKg;
  let quantityScore = 100;
  if (donation.quantityKg < bandFloor && bandFloor > 0) {
    quantityScore = Math.min(100, (donation.quantityKg / bandFloor) * 100);
  }

  // 3. Timing factor (0-100)
  const travelMinutes = (distanceKm / AVG_SPEED_KMPH) * 60;
  const slack = minutesToDeadline - (travelMinutes + HANDLING_BUFFER_MIN);
  let timingScore = 100;
  if (slack < SLACK_FULL_MIN) {
    timingScore = Math.max(0, 20 + 80 * (Math.max(0, slack) / SLACK_FULL_MIN));
  }

  // 4. Need & Suitability (0-100)
  const categoryFit =
    receiver.preferredCategories.length === 0 ||
    receiver.preferredCategories.includes(donation.category)
      ? 100
      : 50;
  const needScore = 0.6 * (receiver.needLevel * 20) + 0.4 * categoryFit;

  const rawFinal =
    distanceScore * WEIGHTS.distance +
    quantityScore * WEIGHTS.quantity +
    timingScore * WEIGHTS.timing +
    needScore * WEIGHTS.need;

  const finalScore = Number(rawFinal.toFixed(1));

  // Build human-readable template explanation (Section 14.4)
  const distDesc =
    distanceScore >= 80
      ? `${distanceKm.toFixed(1)} km away (very close)`
      : distanceScore >= 50
      ? `${distanceKm.toFixed(1)} km away`
      : `${distanceKm.toFixed(1)} km away (outer radius)`;

  const qtyDesc = `${donation.quantityKg} kg fits your remaining ${remainingCapacityKg.toFixed(0)} kg capacity`;

  const hoursSpare = Math.floor(slack / 60);
  const minsSpare = Math.floor(slack % 60);
  const timingDesc =
    slack >= 60
      ? `plenty of time (~${hoursSpare > 0 ? `${hoursSpare}h ` : ''}${minsSpare}m spare)`
      : `tight timeline (~${Math.max(0, minsSpare)}m spare)`;

  const prefDesc =
    categoryFit === 100
      ? 'matches your preferred category'
      : 'acceptable category fit';

  const explanation = `${Math.round(
    finalScore
  )}/100 — ${distDesc}, ${qtyDesc}, ${timingDesc}, level ${receiver.needLevel} need, ${prefDesc}.`;

  return {
    factors: {
      distance: Number(distanceScore.toFixed(1)),
      quantity: Number(quantityScore.toFixed(1)),
      timing: Number(timingScore.toFixed(1)),
      need: Number(needScore.toFixed(1)),
    },
    finalScore,
    explanation,
  };
}

export function computeMatchForReceiver(
  donation: Donation,
  receiver: ReceiverProfile,
  remainingCapacityKg: number,
  now: Date = new Date()
): Match {
  const eligibility = checkEligibility(
    donation,
    receiver,
    remainingCapacityKg,
    now
  );

  if (!eligibility.eligible) {
    return {
      id: `match-${donation.id}-${receiver.id}`,
      donationId: donation.id,
      receiverId: receiver.id,
      eligible: false,
      rejectionCodes: eligibility.rejectionCodes,
      distanceKm: eligibility.distanceKm,
      distanceScore: 0,
      quantityScore: 0,
      timingScore: 0,
      needScore: 0,
      finalScore: null,
      explanation: eligibility.rejectionReasons.join(' '),
      computedAt: now.toISOString(),
      donation,
      receiver,
    };
  }

  const scored = scoreMatch(
    donation,
    receiver,
    remainingCapacityKg,
    eligibility.distanceKm,
    eligibility.minutesToDeadline
  );

  return {
    id: `match-${donation.id}-${receiver.id}`,
    donationId: donation.id,
    receiverId: receiver.id,
    eligible: true,
    rejectionCodes: [],
    distanceKm: eligibility.distanceKm,
    distanceScore: scored.factors.distance,
    quantityScore: scored.factors.quantity,
    timingScore: scored.factors.timing,
    needScore: scored.factors.need,
    finalScore: scored.finalScore,
    explanation: scored.explanation,
    computedAt: now.toISOString(),
    donation,
    receiver,
  };
}
