import { config } from "dotenv";
config({ path: ".env.local" });
import { eq } from "drizzle-orm";
import { db } from "../lib/db/client";
import { jobs } from "../lib/db/schema";
import { scoreJobLegitimacy } from "../lib/legitimacy/scoreJob";

async function main() {
  const unscored = await db.select().from(jobs).where(eq(jobs.legitimacyVerdict, "unscored"));

  if (unscored.length === 0) {
    console.log("No unscored jobs.");
    return;
  }

  console.log(`Scoring ${unscored.length} job(s)...`);

  for (const job of unscored) {
    const result = await scoreJobLegitimacy({
      title: job.title,
      companyName: job.companyName,
      descriptionText: job.descriptionText,
      salaryRawText: job.salaryRawText,
      applyUrl: job.applyUrl,
    });

    await db
      .update(jobs)
      .set({
        legitimacyVerdict: result.verdict,
        legitimacyConfidence: result.confidence,
        legitimacyReasoning: result.reasoning,
        legitimacyFlags: result.flags,
        legitimacyModel: result.model,
        legitimacyScoredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));

    console.log(`  ${job.title} @ ${job.companyName}: ${result.verdict} (${result.confidence})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
