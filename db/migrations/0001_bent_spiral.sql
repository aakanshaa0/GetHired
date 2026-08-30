ALTER TABLE "profiles" ADD COLUMN "skills" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "leetcode_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "portfolio_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "experience_summary" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "achievements_summary" text;