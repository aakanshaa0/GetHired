import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "../lib/db/client";
import { jobSources, rawJobs, jobs, ingestionRuns } from "../lib/db/schema";
import { getAdapter } from "../lib/adapters/registry";
import type { SourceType, NormalizedJob } from "../lib/adapters/types";
import { extractJobFields } from "../lib/llm/extractJobFields";
import { touchCompany } from "../lib/legitimacy/companyCache";

const CIRCUIT_BREAKER_THRESHOLD = 5;

function parseArgs() {
  const sourceArg = process.argv.find((a) => a.startsWith("--source="));
  const source = sourceArg?.split("=")[1] as SourceType | undefined;
  if (!source) {
    console.error("Usage: tsx scripts/ingest.ts --source=<telegram|naukri|wellfound|linkedin|foundit>");
    process.exit(1);
  }
  return { source, dryRun: process.argv.includes("--dry-run") };
}

async function normalizedFromLlmFallback(rawText: string, sourceUrl: string, postedAt: Date | null): Promise<NormalizedJob | null> {
  const extracted = await extractJobFields(rawText);
  if (!extracted || !extracted.isJobPosting || !extracted.title || !extracted.companyName) return null;

  return {
    title: extracted.title,
    companyName: extracted.companyName,
    location: extracted.location,
    isRemote: extracted.isRemote,
    salaryMin: extracted.salaryMin,
    salaryMax: extracted.salaryMax,
    salaryCurrency: "INR",
    salaryPeriod: extracted.salaryPeriod,
    salaryRawText: extracted.salaryMin != null ? `${extracted.salaryMin}-${extracted.salaryMax ?? extracted.salaryMin}` : null,
    salaryConfidence: extracted.salaryConfidence,
    applyUrl: sourceUrl,
    postedAt,
    descriptionText: rawText,
  };
}

async function ingestSource(sourceRow: typeof jobSources.$inferSelect) {
  const adapter = getAdapter(sourceRow.type);
  const [run] = await db.insert(ingestionRuns).values({ sourceId: sourceRow.id }).returning();

  let rawCount = 0;
  let normalizedCount = 0;

  try {
    const rawItems = await adapter.fetchRaw(sourceRow.config as Record<string, unknown>);
    rawCount = rawItems.length;

    for (const item of rawItems) {
      const [inserted] = await db
        .insert(rawJobs)
        .values({
          sourceId: sourceRow.id,
          externalId: item.externalId,
          rawText: item.rawText,
          rawPayload: item.rawPayload,
          sourceUrl: item.sourceUrl,
          fetchedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (!inserted) continue; // already seen on a prior poll

      let normalized = adapter.normalize(item);
      if (!normalized) {
        normalized = await normalizedFromLlmFallback(item.rawText, item.sourceUrl, item.postedAt);
      }

      if (!normalized) {
        await db
          .update(rawJobs)
          .set({ processed: true, processingError: "Could not extract a job posting from this text" })
          .where(eq(rawJobs.id, inserted.id));
        continue;
      }

      const company = await touchCompany(normalized.companyName);

      await db.insert(jobs).values({
        rawJobId: inserted.id,
        sourceType: sourceRow.type,
        externalId: item.externalId,
        title: normalized.title,
        companyName: normalized.companyName,
        companyId: company.id,
        location: normalized.location,
        isRemote: normalized.isRemote,
        salaryMin: normalized.salaryMin,
        salaryMax: normalized.salaryMax,
        salaryCurrency: normalized.salaryCurrency,
        salaryPeriod: normalized.salaryPeriod,
        salaryRawText: normalized.salaryRawText,
        salaryConfidence: normalized.salaryConfidence,
        applyUrl: normalized.applyUrl,
        postedAt: normalized.postedAt,
        descriptionText: normalized.descriptionText,
      });

      await db.update(rawJobs).set({ processed: true }).where(eq(rawJobs.id, inserted.id));
      normalizedCount++;
    }

    await db
      .update(jobSources)
      .set({ lastPolledAt: new Date(), consecutiveFailures: 0 })
      .where(eq(jobSources.id, sourceRow.id));

    await db
      .update(ingestionRuns)
      .set({ finishedAt: new Date(), rawCount, normalizedCount })
      .where(eq(ingestionRuns.id, run.id));

    console.log(`[${sourceRow.type}:${sourceRow.name}] fetched ${rawCount}, normalized ${normalizedCount}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const failures = sourceRow.consecutiveFailures + 1;
    const shouldDisable = failures >= CIRCUIT_BREAKER_THRESHOLD;

    await db
      .update(jobSources)
      .set({
        lastPolledAt: new Date(),
        consecutiveFailures: failures,
        enabled: shouldDisable ? false : sourceRow.enabled,
      })
      .where(eq(jobSources.id, sourceRow.id));

    await db
      .update(ingestionRuns)
      .set({ finishedAt: new Date(), rawCount, normalizedCount, error: message })
      .where(eq(ingestionRuns.id, run.id));

    console.error(
      `[${sourceRow.type}:${sourceRow.name}] failed (${failures}/${CIRCUIT_BREAKER_THRESHOLD} consecutive): ${message}${
        shouldDisable ? " — source auto-disabled, re-enable it from the Sources page once fixed." : ""
      }`
    );
  }
}

async function main() {
  const { source, dryRun } = parseArgs();

  const sources = await db
    .select()
    .from(jobSources)
    .where(and(eq(jobSources.type, source), eq(jobSources.enabled, true)));

  if (sources.length === 0) {
    console.log(`No enabled "${source}" sources configured — add one from the Sources page first.`);
    return;
  }

  if (dryRun) {
    console.log(`Dry run: would poll ${sources.length} "${source}" source(s):`, sources.map((s) => s.name));
    for (const s of sources) {
      const adapter = getAdapter(s.type);
      const items = await adapter.fetchRaw(s.config as Record<string, unknown>);
      console.log(`  ${s.name}: fetched ${items.length} raw item(s), sample:`, items[0]?.rawText.slice(0, 200));
    }
    return;
  }

  for (const sourceRow of sources) {
    await ingestSource(sourceRow);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
