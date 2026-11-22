// Urgency Indicator Pure Function (PRD Section 14.8 & FR-F12)
import { UrgencyLabel } from './types';
import { URGENT_MAX_MIN, EXPIRING_SOON_MAX_MIN } from './constants';

/**
 * Derives the urgency label based on the collection deadline.
 * Used consistently across listing cards, dashboards, details and matching inputs.
 * Logistics indicator only — not a food safety threshold.
 */
export function getUrgency(pickupDeadlineIso: string, now: Date = new Date()): UrgencyLabel | 'EXPIRED' {
  const deadline = new Date(pickupDeadlineIso).getTime();
  const current = now.getTime();
  const diffMinutes = (deadline - current) / (1000 * 60);

  if (diffMinutes <= 0) {
    return 'EXPIRED';
  }
  if (diffMinutes <= URGENT_MAX_MIN) {
    return 'URGENT';
  }
  if (diffMinutes < EXPIRING_SOON_MAX_MIN) {
    return 'EXPIRING_SOON';
  }
  return 'AVAILABLE';
}

export function getMinutesRemaining(pickupDeadlineIso: string, now: Date = new Date()): number {
  const deadline = new Date(pickupDeadlineIso).getTime();
  const current = now.getTime();
  return Math.max(0, Math.floor((deadline - current) / (1000 * 60)));
}
