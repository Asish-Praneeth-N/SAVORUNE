// SAVORUNE Constants (PRD Section 14, 21)
import { Allergen, FoodCategory, StorageCondition } from './types';

export const MAX_RADIUS_KM = 10;
export const D_FULL_KM = 0.5;
export const AVG_SPEED_KMPH = 20;
export const HANDLING_BUFFER_MIN = 30;
export const SLACK_FULL_MIN = 60;
export const QTY_BAND_MIN_RATIO = 0.5;

export const SERVICE_BBOX = {
  minLat: 17.38,
  maxLat: 17.50,
  minLng: 78.32,
  maxLng: 78.46,
};

export const WEIGHTS = {
  distance: 0.30,
  quantity: 0.25,
  timing: 0.25,
  need: 0.20,
};

export const CAPACITY_TZ = 'Asia/Kolkata';
export const RECOVERY_MIN_REMAINING_MIN = 30;
export const URGENT_MAX_MIN = 30;
export const EXPIRING_SOON_MAX_MIN = 90;

export const HANDOFF_PIN_ENABLED = true;
export const HANDOFF_PIN_LENGTH = 6;
export const HANDOFF_PIN_MAX_ATTEMPTS = 5;
export const MAX_ACTIVE_PICKUPS_PER_VOLUNTEER = 2;

// Verbatim Required Disclaimer (PRD Section 21.1)
export const DISCLAIMER_TEXT =
  'SAVORUNE connects food donors and receivers. It does not certify or guarantee food safety. Donors and receivers must independently assess handling and suitability.';

// Centrally defined food-handling guidance (PRD Section 21.2 & FR-H7)
export const STORAGE_HANDLING_GUIDANCE: Record<StorageCondition, string> = {
  HOT_HELD:
    'Keep covered and hot (above 63°C) until handover. Transport promptly in clean, insulated containers. Serve or discard by the stated collection deadline. Inspect carefully on receipt.',
  CHILLED:
    'Keep cold (below 5°C) during transport and storage; do not leave at room temperature. Use refrigerated or ice-packed containers. Inspect packaging and chill immediately on receipt.',
  AMBIENT:
    'Store in a clean, dry, well-ventilated space away from direct heat and pests. Keep in original packaging or sealed containers. Inspect package integrity and expiration dates before distribution.',
  FROZEN:
    'Maintain fully frozen (at or below -18°C) until handover. Do not refreeze once thawed. Transport with dry ice or insulated thermal bags. Inspect for any signs of thawing.',
};

export const ALLERGEN_LIST: Allergen[] = [
  'PEANUTS',
  'TREE_NUTS',
  'DAIRY',
  'EGG',
  'GLUTEN',
  'SOY',
  'FISH',
  'SHELLFISH',
  'SESAME',
  'MUSTARD',
];

export const FOOD_CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'COOKED_MEAL', label: 'Cooked Meal' },
  { value: 'BAKERY', label: 'Bakery' },
  { value: 'FRESH_PRODUCE', label: 'Fresh Produce' },
  { value: 'PACKAGED', label: 'Packaged' },
  { value: 'OTHER', label: 'Other' },
];

export interface SyntheticZone {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const SYNTHETIC_ZONES: SyntheticZone[] = [
  {
    code: 'H1',
    name: 'HITEC City Central (Zone H1)',
    latitude: 17.4435,
    longitude: 78.3772,
  },
  {
    code: 'H2',
    name: 'Madhapur Arts District (Zone H2)',
    latitude: 17.4483,
    longitude: 78.3915,
  },
  {
    code: 'H3',
    name: 'Jubilee Hills Ridge (Zone H3)',
    latitude: 17.4319,
    longitude: 78.4073,
  },
  {
    code: 'H4',
    name: 'Banjara Hills Valley (Zone H4)',
    latitude: 17.4156,
    longitude: 78.4348,
  },
  {
    code: 'H5',
    name: 'Gachibowli Stadium Enclave (Zone H5)',
    latitude: 17.4401,
    longitude: 78.3489,
  },
  {
    code: 'H6',
    name: 'Kondapur Botanical Corridor (Zone H6)',
    latitude: 17.4612,
    longitude: 78.3638,
  },
  {
    code: 'H7',
    name: 'Begumpet Aerodrome Sector (Zone H7)',
    latitude: 17.4448,
    longitude: 78.4682,
  },
];
