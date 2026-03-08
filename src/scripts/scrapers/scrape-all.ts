/**
 * scrape-all.ts
 *
 * Master runner that executes all Division 2 data scrapers in sequence.
 * Reports success/failure for each scraper, tallies data coverage
 * per category, and saves a summary report.
 *
 * Uses execFileSync (not exec) for safe subprocess invocation.
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-all.ts
 */

import { execFileSync } from "child_process";
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
}

// --- Constants ---

const SCRIPTS_DIR = dirname(new URL(import.meta.url).pathname);
const RAW_DIR = resolve(SCRIPTS_DIR, "raw");

// Scrapers to run in order
const SCRAPERS = [
  {
    name: "mx-builds",
    script: "scrape-mx-builds.ts",
    outputFile: "mx-builds-raw.json",
  },
  {
    name: "community-spreadsheet",
    script: "scrape-community-spreadsheet.ts",
    outputFile: "community-spreadsheet-raw.json",
  },
  {
    name: "nightfall-guard",
    script: "scrape-nightfall-guard.ts",
    outputFile: "nightfall-guard-raw.json",
  },
  {
    name: "wiki-fandom",
    script: "scrape-wiki-fandom.ts",
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

/** Run a single scraper as a child process using execFileSync */
function runScraper(scraper: {
  name: string;
  script: string;
  outputFile: string;
}): ScraperResult {
  const scriptPath = resolve(SCRIPTS_DIR, scraper.script);
  const outputPath = resolve(RAW_DIR, scraper.outputFile);
  const projectRoot = resolve(SCRIPTS_DIR, "../../..");

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${scraper.name} (${scraper.script})`);
  console.log("=".repeat(60));

  const startTime = Date.now();

  try {
    // Use execFileSync with npx as the command and tsx + script as arguments
    // This avoids shell injection by not passing through a shell
    execFileSync("npx", ["tsx", scriptPath], {
      cwd: projectRoot,
      stdio: "inherit",
      timeout: 300_000, // 5 minute timeout per scraper
    });

    const durationMs = Date.now() - startTime;

    return {
      name: scraper.name,
      script: scraper.script,
      status: "success",
      durationMs,
      outputFile: outputPath,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error(`\nScraper ${scraper.name} failed: ${errorMessage}`);

    return {
      name: scraper.name,
      script: scraper.script,
      status: "error",
      durationMs,
      outputFile: outputPath,
      error: errorMessage,
    };
  }
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

// --- Main ---

async function main(): Promise<void> {
  console.log("=== SHD Planner — Scrape All ===");
  console.log(`Started at: ${new Date().toISOString()}`);

  // Ensure raw output directory exists
  mkdirSync(RAW_DIR, { recursive: true });

  const overallStart = Date.now();
  const results: ScraperResult[] = [];

  // Run each scraper in sequence
  for (const scraper of SCRAPERS) {
    const result = runScraper(scraper);
    results.push(result);
  }

  const totalDurationMs = Date.now() - overallStart;

  // Build coverage report
  const coverage = buildCoverage(results);

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

  // Save report
  const report: ScrapeReport = {
    runAt: new Date().toISOString(),
    totalDurationMs,
    scrapers: results,
    coverage,
  };

  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\nReport saved to: ${REPORT_PATH}`);
}

// Run
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
