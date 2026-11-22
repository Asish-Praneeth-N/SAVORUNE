-- SAVORUNE Neon bootstrap using genuine Clerk users.
-- Idempotent: rerunning updates the same users/profiles without duplicates.

BEGIN;

INSERT INTO users (clerk_user_id, role, status, display_name, onboarded_at)
VALUES
  ('user_3MQAJyQwnGyfUwKYbXxrZMf5m3a', 'ADMIN', 'ACTIVE', 'Asish Praneeth Namala', now()),
  ('user_3MTHYeNmA0CDNxutcFBZjKEkKFZ', 'DONOR', 'ACTIVE', 'Meera Reddy', now()),
  ('user_3MTHYdd4cfNYduOzsLeCMvWgzVh', 'RECEIVER', 'ACTIVE', 'Ravi Kumar', now()),
  ('user_3MTHYbkpqyJ4PJJr2Av4G5cGfLn', 'RECEIVER', 'ACTIVE', 'Sunita Rao', now()),
  ('user_3MTHYaCI4whtVPlevRx8QZZO7if', 'VOLUNTEER', 'ACTIVE', 'Asha Nair', now())
ON CONFLICT (clerk_user_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = 'ACTIVE',
  display_name = EXCLUDED.display_name,
  onboarded_at = COALESCE(users.onboarded_at, now()),
  updated_at = now();

INSERT INTO donor_profiles (
  user_id, business_name, zone_code, latitude, longitude, default_instructions
)
SELECT
  id,
  'Tamarind Terrace',
  'H1',
  17.443500,
  78.377200,
  'Collect from the marked service entrance using clean insulated containers.'
FROM users
WHERE clerk_user_id = 'user_3MTHYeNmA0CDNxutcFBZjKEkKFZ'
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  zone_code = EXCLUDED.zone_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  default_instructions = EXCLUDED.default_instructions;

INSERT INTO receiver_profiles (
  user_id, organization_name, receiver_type, zone_code, latitude, longitude,
  daily_capacity_kg, diet_policy, avoid_allergens, preferred_categories, need_level
)
SELECT
  id,
  'Hope Harvest Kitchen',
  'COMMUNITY_KITCHEN',
  'H2',
  17.448300,
  78.391500,
  60.0,
  'ANY',
  ARRAY[]::text[],
  ARRAY['COOKED_MEAL', 'FRESH_PRODUCE']::text[],
  4
FROM users
WHERE clerk_user_id = 'user_3MTHYdd4cfNYduOzsLeCMvWgzVh'
ON CONFLICT (user_id) DO UPDATE SET
  organization_name = EXCLUDED.organization_name,
  receiver_type = EXCLUDED.receiver_type,
  zone_code = EXCLUDED.zone_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  daily_capacity_kg = EXCLUDED.daily_capacity_kg,
  diet_policy = EXCLUDED.diet_policy,
  avoid_allergens = EXCLUDED.avoid_allergens,
  preferred_categories = EXCLUDED.preferred_categories,
  need_level = EXCLUDED.need_level;

INSERT INTO receiver_profiles (
  user_id, organization_name, receiver_type, zone_code, latitude, longitude,
  daily_capacity_kg, diet_policy, avoid_allergens, preferred_categories, need_level
)
SELECT
  id,
  'Sunrise Shelter Collective',
  'SHELTER',
  'H3',
  17.431900,
  78.407300,
  40.0,
  'VEG_ONLY',
  ARRAY['PEANUTS']::text[],
  ARRAY['COOKED_MEAL', 'BAKERY']::text[],
  5
FROM users
WHERE clerk_user_id = 'user_3MTHYbkpqyJ4PJJr2Av4G5cGfLn'
ON CONFLICT (user_id) DO UPDATE SET
  organization_name = EXCLUDED.organization_name,
  receiver_type = EXCLUDED.receiver_type,
  zone_code = EXCLUDED.zone_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  daily_capacity_kg = EXCLUDED.daily_capacity_kg,
  diet_policy = EXCLUDED.diet_policy,
  avoid_allergens = EXCLUDED.avoid_allergens,
  preferred_categories = EXCLUDED.preferred_categories,
  need_level = EXCLUDED.need_level;

INSERT INTO volunteer_profiles (
  user_id, zone_code, latitude, longitude, availability_note, max_active_pickups
)
SELECT
  id,
  'H3',
  17.431900,
  78.407300,
  'Available for evening rescue runs across the Hyderabad service zones.',
  2
FROM users
WHERE clerk_user_id = 'user_3MTHYaCI4whtVPlevRx8QZZO7if'
ON CONFLICT (user_id) DO UPDATE SET
  zone_code = EXCLUDED.zone_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  availability_note = EXCLUDED.availability_note,
  max_active_pickups = EXCLUDED.max_active_pickups;

INSERT INTO impact_settings (
  id, grams_per_meal, co2e_kg_per_kg_food, co2e_source_note, updated_by, updated_at
)
SELECT 1, 400, NULL, NULL, id, now()
FROM users
WHERE clerk_user_id = 'user_3MQAJyQwnGyfUwKYbXxrZMf5m3a'
ON CONFLICT (id) DO UPDATE SET
  grams_per_meal = EXCLUDED.grams_per_meal,
  updated_by = EXCLUDED.updated_by,
  updated_at = now();

COMMIT;

-- Verification: must return five users.
SELECT clerk_user_id, role, status, display_name
FROM users
WHERE clerk_user_id IN (
  'user_3MQAJyQwnGyfUwKYbXxrZMf5m3a',
  'user_3MTHYeNmA0CDNxutcFBZjKEkKFZ',
  'user_3MTHYdd4cfNYduOzsLeCMvWgzVh',
  'user_3MTHYbkpqyJ4PJJr2Av4G5cGfLn',
  'user_3MTHYaCI4whtVPlevRx8QZZO7if'
)
ORDER BY role, display_name;

SELECT u.display_name, u.role, dp.business_name AS organization, dp.zone_code
FROM users u JOIN donor_profiles dp ON dp.user_id = u.id
UNION ALL
SELECT u.display_name, u.role, rp.organization_name, rp.zone_code
FROM users u JOIN receiver_profiles rp ON rp.user_id = u.id
UNION ALL
SELECT u.display_name, u.role, 'Independent volunteer', vp.zone_code
FROM users u JOIN volunteer_profiles vp ON vp.user_id = u.id
ORDER BY role, display_name;
