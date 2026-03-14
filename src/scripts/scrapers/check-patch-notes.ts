/**
 * check-patch-notes.ts
 *
 * Simple change detector for patch notes/news sources.
 * Writes raw/update-signal.json with hash + changed flag.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import crypto from "crypto";

const OUTPUT_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "raw/update-signal.json"
);

const SOURCES = [
  process.env.DIV2_PATCH_NOTES_URL ?? "https://news.ubisoft.com/en-us/search?query=the%20division%202",
  process.env.DIV2_TWITTER_RSS_URL ?? "https://nitter.net/TheDivisionGame/rss",
];

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function hash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function main() {
  const results: any[] = [];
  let changed = false;

  for (const url of SOURCES) {
    try {
      const text = await fetchText(url);
      const h = hash(text);
      results.push({ url, hash: h, ok: true });
    } catch (err: any) {
      results.push({ url, error: err?.message ?? String(err), ok: false });
    }
  }

  let previous: any = null;
  if (existsSync(OUTPUT_PATH)) {
    try {
      previous = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
    } catch {}
  }

  if (previous?.sources) {
    for (const r of results) {
      const prev = previous.sources.find((p: any) => p.url === r.url);
      if (prev && prev.hash && r.hash && prev.hash !== r.hash) changed = true;
    }
  } else {
    changed = true;
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        changed,
        sources: results,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`Patch note check complete. changed=${changed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
