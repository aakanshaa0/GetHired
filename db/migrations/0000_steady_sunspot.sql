CREATE TYPE "public"."company_source" AS ENUM('seed', 'llm', 'user');--> statement-breakpoint
CREATE TYPE "public"."job_source_type" AS ENUM('telegram', 'naukri', 'wellfound', 'linkedin', 'foundit');--> statement-breakpoint
CREATE TYPE "public"."legitimacy_override" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."legitimacy_status" AS ENUM('whitelisted', 'blacklisted', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."legitimacy_verdict" AS ENUM('legit', 'suspicious', 'scam', 'unscored');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('suggested', 'viewed', 'ready', 'applied', 'skipped', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'web_push');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."salary_bucket" AS ENUM('above_threshold', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."salary_confidence" AS ENUM('known', 'estimated', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."salary_period" AS ENUM('annual', 'monthly');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"domain" text,
	"legitimacy_status" "legitimacy_status" DEFAULT 'unknown' NOT NULL,
	"notes" text,
	"source" "company_source" DEFAULT 'seed' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "cvs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_tag" text NOT NULL,
	"keywords" text[] DEFAULT '{}' NOT NULL,
	"storage_path" text NOT NULL,
	"file_name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"raw_count" integer DEFAULT 0 NOT NULL,
	"normalized_count" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "job_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "job_source_type" NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"poll_interval_minutes" integer DEFAULT 60 NOT NULL,
	"last_polled_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"raw_job_id" uuid NOT NULL,
	"source_type" "job_source_type" NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"company_name" text NOT NULL,
	"company_id" uuid,
	"location" text,
	"is_remote" boolean DEFAULT false NOT NULL,
	"salary_min" numeric,
	"salary_max" numeric,
	"salary_currency" text DEFAULT 'INR' NOT NULL,
	"salary_period" "salary_period",
	"salary_raw_text" text,
	"salary_confidence" "salary_confidence" DEFAULT 'unknown' NOT NULL,
	"role_tags" text[] DEFAULT '{}' NOT NULL,
	"apply_url" text NOT NULL,
	"posted_at" timestamp with time zone,
	"description_text" text,
	"dedupe_hash" text,
	"legitimacy_verdict" "legitimacy_verdict" DEFAULT 'unscored' NOT NULL,
	"legitimacy_confidence" numeric,
	"legitimacy_reasoning" text,
	"legitimacy_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legitimacy_model" text,
	"legitimacy_scored_at" timestamp with time zone,
	"legitimacy_user_override" "legitimacy_override",
	"legitimacy_override_note" text,
	"legitimacy_overridden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"match_score" numeric DEFAULT 0 NOT NULL,
	"match_reason" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cv_id" uuid,
	"cv_id_override" uuid,
	"referral_text" text,
	"salary_bucket" "salary_bucket" DEFAULT 'unknown' NOT NULL,
	"status" "match_status" DEFAULT 'suggested' NOT NULL,
	"applied_at" timestamp with time zone,
	"skipped_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"college" text,
	"years_experience" numeric,
	"target_roles" text[] DEFAULT '{}' NOT NULL,
	"min_salary_lpa" numeric DEFAULT 8 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"raw_text" text NOT NULL,
	"raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_url" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	CONSTRAINT "raw_jobs_source_external_unique" UNIQUE("source_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "referral_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_raw_job_id_raw_jobs_id_fk" FOREIGN KEY ("raw_job_id") REFERENCES "public"."raw_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_cv_id_override_cvs_id_fk" FOREIGN KEY ("cv_id_override") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_jobs" ADD CONSTRAINT "raw_jobs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_templates" ADD CONSTRAINT "referral_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;