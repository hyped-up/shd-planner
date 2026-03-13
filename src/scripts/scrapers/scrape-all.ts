/**
 * scrape-all.ts
 *
 * Master runner that executes all Division 2 data scrapers.
 * Uses async child processes to avoid blocking the Node.js event loop.
 * Reports success/failure for each scraper, tallies data coverage
 * per category, and saves a summary report.
 *
 * Exit codes:
 *   0 — at least one scraper succeeded and entity counts are stable/growing
 *   1 — all scrapers failed, or entity count regressed
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-all.ts
 * Production: node /app/dist/scripts/scrapers/scrape-all.js
 */

import { execFile } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

// --- Types ---

interface ScraperResult {
  name: string;
  script: string;
  status: "success" | "error";
  durationMs: number;
  outputFile: string;
  error?: string;
}

interface CategoryCoverage {
  [category: string]: {
    total: number;
    byScraper: { [scraperName: string]: number };
  };
}

interface ScrapeReport {
  runAt: string;
  totalDurationMs: number;
  scrapers: ScraperResult[];
  coverage: CategoryCoverage;
  entityCounts: Record<string, number>;
}

// --- Constants ---

// Support both ESM (import.meta.url) and CJS (__dirname) for compiled output
const SCRIPTS_DIR = typeof __dirname !== "undefined"
  ? __dirname
  : dirname(new URL(import.meta.url).pathname);

// Env-var-driven paths for Docker, fallback to relative for dev
const RAW_DIR = process.env.RAW_DIR ?? resolve(SCRIPTS_DIR, "raw");

// Scrapers to run in order
const SCRAPERS = [
  {
    name: "mx-builds",
    script: "scrape-mx-builds.ts",
    compiledScript: "scrape-mx-builds.js",
    outputFile: "mx-builds-raw.json",
  },
  {
    name: "community-spreadsheet",
    script: "scrape-community-spreadsheet.ts",
    compiledScript: "scrape-community-spreadsheet.js",
    outputFile: "community-spreadsheet-raw.json",
  },
  {
    name: "nightfall-guard",
    script: "scrape-nightfall-guard.ts",
    compiledScript: "scrape-nightfall-guard.js",
    outputFile: "nightfall-guard-raw.json",
  },
  {
    name: "wiki-fandom",
    script: "scrape-wiki-fandom.ts",
    compiledScript: "scrape-wiki-fandom.js",
    outputFile: "wiki-raw.json",
  },
];

const REPORT_PATH = resolve(RAW_DIR, "scrape-report.json");

// Categories we track across all scrapers
const ALL_CATEGORIES = [
  "weapons",
  "gear",
  "brandSets",
  "gearSets",
  "exotics",
  "talents",
  "skills",
  "namedItems",
  "other",
];

// --- Helpers ---

/** Determine whether to use compiled JS or TS+tsx */
function getScriptCommand(scraper: typeof SCRAPERS[number]): { cmd: string; args: string[] } {
  const compiledPath = resolve(SCRIPTS_DIR, scraper.compiledScript);
  if (existsSync(compiledPath)) {
    // Production: run compiled JS directly with Node
    return { cmd: "node", args: [compiledPath] };
  }
  // Development: use tsx for TypeScript
  const tsPath = resolve(SCRIPTS_DIR, scraper.script);
  return { cmd: "npx", args: ["tsx", tsPath] };
}

/** Run a single scraper as an async child process */
function runScraperAsync(scraper: typeof SCRAPERS[number]): Promise<ScraperResult> {
  const outputPath = resolve(RAW_DIR, scraper.outputFile);
  const projectRoot = resolve(SCRIPTS_DIR, "../../..");
  const { cmd, args } = getScriptCommand(scraper);

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${scraper.name} (${cmd} ${args.join(" ")})`);
  console.log("=".repeat(60));

  const startTime = Date.now();

  return new Promise((resolve) => {
    execFile(cmd, args, {
      cwd: projectRoot,
      timeout: 300_000, // 5 minute timeout per scraper
      maxBuffer: 10 * 1024 * 1024, // 10MB output buffer
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;

      // Print stdout/stderr for visibility
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      if (error) {
        const errorMessage = error.message;
        console.error(`\nScraper ${scraper.name} failed: ${errorMessage}`);
        resolve({
          name: scraper.name,
          script: scraper.script,
          status: "error",
          durationMs,
          outputFile: outputPath,
          error: errorMessage,
        });
      } else {
        resolve({
          name: scraper.name,
          script: scraper.script,
          status: "success",
          durationMs,
          outputFile: outputPath,
        });
      }
    });
  });
}

/** Read a scraper's output file and count items per category */
function countCoverage(
  outputFile: string,
  scraperName: string
): Record<string, number> {
  const counts: Record<string, number> = {};

  if (!existsSync(outputFile)) return counts;

  try {
    const raw = readFileSync(outputFile, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;

    // All scrapers store data under an "extracted" key
    const extracted = data.extracted as Record<string, unknown[]> | undefined;
    if (!extracted) return counts;

    for (const [category, items] of Object.entries(extracted)) {
      if (Array.isArray(items) && items.length > 0) {
        counts[category] = items.length;
      }
    }
  } catch (err) {
    console.warn(
      `  Could not read coverage from ${scraperName}: ${err}`
    );
  }

  return counts;
}

/** Build the aggregate coverage summary across all scrapers */
function buildCoverage(results: ScraperResult[]): CategoryCoverage {
  const coverage: CategoryCoverage = {};

  // Initialize all categories
  for (const cat of ALL_CATEGORIES) {
    coverage[cat] = { total: 0, byScraper: {} };
  }

  for (const result of results) {
    if (result.status !== "success") continue;

    const counts = countCoverage(result.outputFile, result.name);
    for (const [category, count] of Object.entries(counts)) {
      if (!coverage[category]) {
        coverage[category] = { total: 0, byScraper: {} };
      }
      coverage[category].byScraper[result.name] = count;
      coverage[category].total += count;
    }
  }

  return coverage;
}

/** Count total entities across all coverage categories */
function totalEntityCount(coverage: CategoryCoverage): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [category, data] of Object.entries(coverage)) {
    if (data.total > 0) {
      counts[category] = data.total;
    }
  }
  return counts;
}

/** Read existing entity counts from the current manifest for comparison */
function getExistingEntityCounts(): number {
  const dataDir = process.env.DATA_DIR ?? resolve(SCRIPTS_DIR, "../../../src/data");
  const manifestPath = resolve(dataDir, "manifest.json");
  try {
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      return Object.values(manifest.entityCounts ?? {}).reduce(
        (sum: number, count) => sum + (count as number), 0
      );
    }
  } catch {
    // Ignore — no existing manifest
  }
  return 0;
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== SHD Planner — Scrape All ===");
  console.log(`Started at: ${new Date().toISOString()}`);

  // Ensure raw output directory exists
  mkdirSync(RAW_DIR, { recursive: true });

  const overallStart = Date.now();
  const results: ScraperResult[] = [];

  // Run each scraper sequentially (they share rate-limited APIs)
  for (const scraper of SCRAPERS) {
    const result = await runScraperAsync(scraper);
    results.push(result);
  }

  const totalDurationMs = Date.now() - overallStart;

  // Build coverage report
  const coverage = buildCoverage(results);
  const entityCounts = totalEntityCount(coverage);

  // Print final summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("FINAL REPORT");
  console.log("=".repeat(60));

  console.log("\nScraper Results:");
  for (const r of results) {
    const statusIcon = r.status === "success" ? "[OK]" : "[FAIL]";
    console.log(
      `  ${statusIcon} ${r.name} — ${(r.durationMs / 1000).toFixed(1)}s`
    );
    if (r.error) {
      console.log(`       Error: ${r.error.substring(0, 100)}`);
    }
  }

  console.log("\nData Coverage by Category:");
  for (const [category, data] of Object.entries(coverage)) {
    if (data.total > 0) {
      const sources = Object.entries(data.byScraper)
        .map(([name, count]) => `${name}:${count}`)
        .join(", ");
      console.log(`  ${category}: ${data.total} total (${sources})`);
    }
  }

  const successCount = results.filter((r) => r.status === "success").length;
  console.log(
    `\nCompleted: ${successCount}/${results.length} scrapers succeeded in ${(totalDurationMs / 1000).toFixed(1)}s`
  );

  // Save report with entity counts
  const report: ScrapeReport = {
    runAt: new Date().toISOString(),
    totalDurationMs,
    scrapers: results,
    coverage,
    entityCounts,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\nReport saved to: ${REPORT_PATH}`);

  // --- Exit code logic ---
  // All scrapers failed → exit 1
  if (successCount === 0) {
    console.error("\nAll scrapers failed. Exiting with code 1.");
    process.exit(1);
  }

  // Check entity count regression
  const newTotal = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);
  const existingTotal = getExistingEntityCounts();
  if (existingTotal > 0 && newTotal < existingTotal) {
    console.error(
      `\nEntity count regression detected: ${newTotal} < ${existingTotal}. Exiting with code 1.`
    );
    process.exit(1);
  }

  console.log("\nScrape completed successfully.");
}

// Run
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
