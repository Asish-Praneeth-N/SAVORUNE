CREATE TYPE "public"."allergen_status" AS ENUM('NONE_DECLARED', 'DECLARED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('ACTIVE', 'RELEASED', 'COMPLETED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."collector_type" AS ENUM('VOLUNTEER', 'RECEIVER');--> statement-breakpoint
CREATE TYPE "public"."diet_policy" AS ENUM('ANY', 'VEG_ONLY');--> statement-breakpoint
CREATE TYPE "public"."diet_type" AS ENUM('VEG', 'NON_VEG');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('POSTED', 'CLAIMED', 'COLLECTED', 'DELIVERED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."failure_reason" AS ENUM('DONOR_UNAVAILABLE', 'RECEIVER_UNAVAILABLE', 'VOLUNTEER_UNAVAILABLE', 'FOOD_UNSUITABLE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."food_category" AS ENUM('COOKED_MEAL', 'BAKERY', 'FRESH_PRODUCE', 'PACKAGED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."pickup_status" AS ENUM('UNASSIGNED', 'ASSIGNED', 'ACCEPTED', 'COLLECTED', 'DELIVERED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."receiver_type" AS ENUM('NGO', 'COMMUNITY_KITCHEN', 'SHELTER');--> statement-breakpoint
CREATE TYPE "public"."storage_condition" AS ENUM('HOT_HELD', 'CHILLED', 'AMBIENT', 'FROZEN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('DONOR', 'RECEIVER', 'VOLUNTEER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" "claim_status" DEFAULT 'ACTIVE' NOT NULL,
	"match_score" numeric(4, 1),
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"close_reason" text,
	"receiver_safety_ack_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "food_category" NOT NULL,
	"diet_type" "diet_type" NOT NULL,
	"quantity_kg" numeric(6, 1) NOT NULL,
	"estimated_servings" integer NOT NULL,
	"prepared_at" timestamp with time zone,
	"pickup_deadline" timestamp with time zone NOT NULL,
	"storage_condition" "storage_condition" NOT NULL,
	"allergen_status" "allergen_status" NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"pickup_instructions" text,
	"pickup_latitude" numeric(9, 6) NOT NULL,
	"pickup_longitude" numeric(9, 6) NOT NULL,
	"status" "donation_status" DEFAULT 'POSTED' NOT NULL,
	"safety_ack_at" timestamp with time zone NOT NULL,
	"collected_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"delivered_late" boolean DEFAULT false NOT NULL,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"zone_code" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"default_instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "impact_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"grams_per_meal" integer DEFAULT 400 NOT NULL,
	"co2e_kg_per_kg_food" numeric(4, 2),
	"co2e_source_note" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"eligible" boolean NOT NULL,
	"rejection_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"distance_km" numeric(5, 2),
	"distance_score" numeric(4, 1),
	"quantity_score" numeric(4, 1),
	"timing_score" numeric(4, 1),
	"need_score" numeric(4, 1),
	"final_score" numeric(4, 1),
	"explanation" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"donation_id" uuid NOT NULL,
	"collector_type" "collector_type",
	"volunteer_id" uuid,
	"status" "pickup_status" DEFAULT 'UNASSIGNED' NOT NULL,
	"accepted_at" timestamp with time zone,
	"collected_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failure_reason" "failure_reason",
	"failure_note" text,
	"handoff_pin" text,
	"handoff_pin_attempts" smallint DEFAULT 0 NOT NULL,
	"handoff_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pickups_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
CREATE TABLE "receiver_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_name" text NOT NULL,
	"receiver_type" "receiver_type" NOT NULL,
	"zone_code" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"daily_capacity_kg" numeric(7, 1) NOT NULL,
	"diet_policy" "diet_policy" DEFAULT 'ANY' NOT NULL,
	"avoid_allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred_categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"need_level" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receiver_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donation_id" uuid NOT NULL,
	"pickup_id" uuid,
	"from_status" "donation_status",
	"to_status" "donation_status" NOT NULL,
	"actor_user_id" uuid,
	"actor_role" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"display_name" text NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"zone_code" text NOT NULL,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"availability_note" text,
	"max_active_pickups" smallint DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "volunteer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_receiver_id_receiver_profiles_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."receiver_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_donor_profiles_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_settings" ADD CONSTRAINT "impact_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_receiver_id_receiver_profiles_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."receiver_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickups" ADD CONSTRAINT "pickups_volunteer_id_volunteer_profiles_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteer_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receiver_profiles" ADD CONSTRAINT "receiver_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_pickup_id_pickups_id_fk" FOREIGN KEY ("pickup_id") REFERENCES "public"."pickups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "claims_active_donation_idx" ON "claims" USING btree ("donation_id") WHERE status = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "claims_receiver_status_idx" ON "claims" USING btree ("receiver_id","status");--> statement-breakpoint
CREATE INDEX "donations_status_deadline_idx" ON "donations" USING btree ("status","pickup_deadline");--> statement-breakpoint
CREATE INDEX "donations_donor_status_idx" ON "donations" USING btree ("donor_id","status");--> statement-breakpoint
CREATE INDEX "donations_created_at_idx" ON "donations" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_donation_receiver_idx" ON "matches" USING btree ("donation_id","receiver_id");--> statement-breakpoint
CREATE INDEX "matches_receiver_score_idx" ON "matches" USING btree ("receiver_id","final_score");--> statement-breakpoint
CREATE INDEX "pickups_status_idx" ON "pickups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pickups_volunteer_status_idx" ON "pickups" USING btree ("volunteer_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "pickups_open_donation_idx" ON "pickups" USING btree ("donation_id") WHERE status IN ('UNASSIGNED', 'ASSIGNED', 'ACCEPTED', 'COLLECTED');--> statement-breakpoint
CREATE INDEX "status_history_donation_idx" ON "status_history" USING btree ("donation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");