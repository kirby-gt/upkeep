CREATE TABLE IF NOT EXISTS "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"type" text DEFAULT 'Note' NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"next_action" text DEFAULT '' NOT NULL,
	"follow_up_date" date,
	"by" text DEFAULT '' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"company" boolean DEFAULT false NOT NULL,
	"company_name" text DEFAULT '' NOT NULL,
	"mobile" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"line1" text DEFAULT '' NOT NULL,
	"line2" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"village" text DEFAULT '' NOT NULL,
	"region" text DEFAULT '' NOT NULL,
	"country" text DEFAULT 'Guyana' NOT NULL,
	"gps" text DEFAULT '' NOT NULL,
	"type_category" text DEFAULT 'Residential' NOT NULL,
	"type_sub" text DEFAULT '' NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"contact_mobile" text DEFAULT '' NOT NULL,
	"contact_home" text DEFAULT '' NOT NULL,
	"contact_office" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_role" text DEFAULT 'Owner' NOT NULL,
	"owner_id" uuid,
	"target_clients" text[] DEFAULT '{}' NOT NULL,
	"pipeline_status" text DEFAULT 'new_lead' NOT NULL,
	"landlord_cost" numeric,
	"client_rental" numeric,
	"deposit" numeric,
	"lease_start" date,
	"lease_end" date,
	"renewal_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" text DEFAULT 'Initial Site Visit' NOT NULL,
	"status" text DEFAULT 'Scheduled' NOT NULL,
	"attendees" integer DEFAULT 1 NOT NULL,
	"client" text DEFAULT 'Internal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visits" ADD CONSTRAINT "visits_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
