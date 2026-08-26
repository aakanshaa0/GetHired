import {
  pgTable,
  pgSchema,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

// Supabase manages this table; we only reference it for foreign keys.
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const jobSourceTypeEnum = pgEnum("job_source_type", [
  "telegram",
  "naukri",
  "wellfound",
  "linkedin",
  "foundit",
]);

export const legitimacyStatusEnum = pgEnum("legitimacy_status", [
  "whitelisted",
  "blacklisted",
  "unknown",
]);

export const companySourceEnum = pgEnum("company_source", ["seed", "llm", "user"]);

export const salaryConfidenceEnum = pgEnum("salary_confidence", [
  "known",
  "estimated",
  "unknown",
]);

export const salaryPeriodEnum = pgEnum("salary_period", ["annual", "monthly"]);

export const legitimacyVerdictEnum = pgEnum("legitimacy_verdict", [
  "legit",
  "suspicious",
  "scam",
  "unscored",
]);

export const legitimacyOverrideEnum = pgEnum("legitimacy_override", [
  "approved",
  "rejected",
]);

export const salaryBucketEnum = pgEnum("salary_bucket", ["above_threshold", "unknown"]);

export const matchStatusEnum = pgEnum("match_status", [
  "suggested",
  "viewed",
  "ready",
  "applied",
  "skipped",
  "expired",
]);

export const notificationChannelEnum = pgEnum("notification_channel", ["email", "web_push"]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  college: text("college"),
  yearsExperience: numeric("years_experience", { mode: "number" }),
  targetRoles: text("target_roles").array().notNull().default([]),
  minSalaryLpa: numeric("min_salary_lpa", { mode: "number" }).notNull().default(8),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cvs = pgTable("cvs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  roleTag: text("role_tag").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  storagePath: text("storage_path").notNull(),
  fileName: text("file_name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referralTemplates = pgTable("referral_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  body: text("body").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  domain: text("domain"),
  legitimacyStatus: legitimacyStatusEnum("legitimacy_status").notNull().default("unknown"),
  notes: text("notes"),
  source: companySourceEnum("source").notNull().default("seed"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobSources = pgTable("job_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: jobSourceTypeEnum("type").notNull(),
  name: text("name").notNull(),
  config: jsonb("config").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  pollIntervalMinutes: integer("poll_interval_minutes").notNull().default(60),
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rawJobs = pgTable(
  "raw_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => jobSources.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    rawText: text("raw_text").notNull(),
    rawPayload: jsonb("raw_payload").notNull().default({}),
    sourceUrl: text("source_url"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    processed: boolean("processed").notNull().default(false),
    processingError: text("processing_error"),
  },
  (table) => [unique("raw_jobs_source_external_unique").on(table.sourceId, table.externalId)]
);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  rawJobId: uuid("raw_job_id")
    .notNull()
    .references(() => rawJobs.id, { onDelete: "cascade" }),
  sourceType: jobSourceTypeEnum("source_type").notNull(),
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  companyName: text("company_name").notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  location: text("location"),
  isRemote: boolean("is_remote").notNull().default(false),
  salaryMin: numeric("salary_min", { mode: "number" }),
  salaryMax: numeric("salary_max", { mode: "number" }),
  salaryCurrency: text("salary_currency").notNull().default("INR"),
  salaryPeriod: salaryPeriodEnum("salary_period"),
  salaryRawText: text("salary_raw_text"),
  salaryConfidence: salaryConfidenceEnum("salary_confidence").notNull().default("unknown"),
  roleTags: text("role_tags").array().notNull().default([]),
  applyUrl: text("apply_url").notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  descriptionText: text("description_text"),
  dedupeHash: text("dedupe_hash"),

  legitimacyVerdict: legitimacyVerdictEnum("legitimacy_verdict").notNull().default("unscored"),
  legitimacyConfidence: numeric("legitimacy_confidence", { mode: "number" }),
  legitimacyReasoning: text("legitimacy_reasoning"),
  legitimacyFlags: jsonb("legitimacy_flags").notNull().default([]),
  legitimacyModel: text("legitimacy_model"),
  legitimacyScoredAt: timestamp("legitimacy_scored_at", { withTimezone: true }),
  legitimacyUserOverride: legitimacyOverrideEnum("legitimacy_user_override"),
  legitimacyOverrideNote: text("legitimacy_override_note"),
  legitimacyOverriddenAt: timestamp("legitimacy_overridden_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  matchScore: numeric("match_score", { mode: "number" }).notNull().default(0),
  matchReason: jsonb("match_reason").notNull().default({}),
  cvId: uuid("cv_id").references(() => cvs.id),
  cvIdOverride: uuid("cv_id_override").references(() => cvs.id),
  referralText: text("referral_text"),
  salaryBucket: salaryBucketEnum("salary_bucket").notNull().default("unknown"),
  status: matchStatusEnum("status").notNull().default("suggested"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  skippedAt: timestamp("skipped_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),
  payload: jsonb("payload").notNull().default({}),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => jobSources.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  rawCount: integer("raw_count").notNull().default(0),
  normalizedCount: integer("normalized_count").notNull().default(0),
  error: text("error"),
});
