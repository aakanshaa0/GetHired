import * as cheerio from "cheerio";
import type { JobSourceAdapter, RawJob, NormalizedJob } from "./types";
import { parseSalaryFromText } from "../matching/salaryParser";

export interface TelegramSourceConfig {
  /** Public channel username, without the @ (e.g. "hiringjobsindia"). */
  channel: string;
  /** How many additional history pages to walk on a cold start. Default 1 (latest page only). */
  maxPages?: number;
}

const TITLE_HINT = /(?:hiring|role|position|opening|profile)\s*[:\-]\s*(.+)/i;
const COMPANY_HINT = /(?:company|organi[sz]ation|client)\s*[:\-]\s*(.+)/i;
const REMOTE_HINT = /\b(remote|work from home|wfh)\b/i;

function extractOldestPostId(html: string): string | null {
  const $ = cheerio.load(html);
  const posts = $("[data-post]")
    .map((_, el) => $(el).attr("data-post"))
    .get();
  if (posts.length === 0) return null;
  // data-post looks like "channel/12345" — the feed is newest-first, so the
  // last element on the page is the oldest post loaded so far.
  return posts[posts.length - 1] ?? null;
}

async function fetchPage(channel: string, before?: string): Promise<string> {
  const url = new URL(`https://t.me/s/${channel}`);
  if (before) url.searchParams.set("before", before);

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; GetHiredBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Telegram preview fetch failed for ${channel}: ${res.status}`);
  }
  return res.text();
}

function parsePage(html: string, channel: string): RawJob[] {
  const $ = cheerio.load(html);
  const jobs: RawJob[] = [];

  $(".tgme_widget_message_wrap").each((_, wrap) => {
    const el = $(wrap).find("[data-post]").first();
    const postId = el.attr("data-post");
    if (!postId) return;

    const textEl = el.find(".tgme_widget_message_text").first();
    const rawText = textEl.text().trim();
    if (!rawText) return;

    const dateAttr = el.find(".tgme_widget_message_date time").attr("datetime");
    const postedAt = dateAttr ? new Date(dateAttr) : null;

    const links = textEl
      .find("a")
      .map((_, a) => $(a).attr("href"))
      .get()
      .filter((href): href is string => Boolean(href));
    const externalApplyLink = links.find(
      (href) => !href.includes("t.me/") && !href.startsWith("mailto:")
    );

    jobs.push({
      externalId: postId,
      rawText,
      rawPayload: { channel, links },
      sourceUrl: externalApplyLink ?? `https://t.me/${postId}`,
      postedAt,
    });
  });

  return jobs;
}

export const telegramAdapter: JobSourceAdapter = {
  type: "telegram",

  async fetchRaw(config): Promise<RawJob[]> {
    const { channel, maxPages = 1 } = config as unknown as TelegramSourceConfig;
    if (!channel) throw new Error("Telegram source config missing 'channel'");

    const all: RawJob[] = [];
    let before: string | undefined;

    for (let page = 0; page < Math.max(1, maxPages); page++) {
      const html = await fetchPage(channel, before);
      const pageJobs = parsePage(html, channel);
      if (pageJobs.length === 0) break;
      all.push(...pageJobs);

      const oldest = extractOldestPostId(html);
      if (!oldest || oldest === before) break;
      before = oldest;
    }

    return all;
  },

  normalize(raw: RawJob): NormalizedJob | null {
    const titleMatch = raw.rawText.match(TITLE_HINT);
    const companyMatch = raw.rawText.match(COMPANY_HINT);

    // Telegram posts are the messiest source we ingest — only normalize here
    // when both title and company are confidently labeled; otherwise defer
    // to the Claude extraction fallback in scripts/ingest.ts.
    if (!titleMatch || !companyMatch) return null;

    const salary = parseSalaryFromText(raw.rawText);
    const isRemote = REMOTE_HINT.test(raw.rawText);

    return {
      title: titleMatch[1].split("\n")[0].trim(),
      companyName: companyMatch[1].split("\n")[0].trim(),
      location: null,
      isRemote,
      salaryMin: salary?.min ?? null,
      salaryMax: salary?.max ?? null,
      salaryCurrency: salary?.currency ?? "INR",
      salaryPeriod: salary?.period ?? null,
      salaryRawText: salary?.rawText ?? null,
      salaryConfidence: salary?.confidence ?? "unknown",
      applyUrl: raw.sourceUrl,
      postedAt: raw.postedAt,
      descriptionText: raw.rawText,
    };
  },
};
