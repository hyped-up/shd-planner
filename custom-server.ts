/**
 * custom-server.ts — Custom entrypoint for SHD Planner Docker container
 *
 * Wraps the Next.js standalone server and adds:
 * - node-cron scheduler for automatic data updates
 * - Fandom Wiki change detection
 * - Async scraper execution + merge pipeline
 * - Hot-reload via clearDataCache()
 * - Retry with exponential backoff on failure
 *
 * Environment variables:
 *   DATA_DIR              — Path to canonical JSON data (default: /app/data)
 *   RAW_DIR               — Path for scraper working files (default: /app/raw)
 *   DATA_UPDATE_INTERVAL  — Update frequency: 1d, 7d, 14d, 30d (default: 7d)
 */

import { execFile } from "child_process";
import * as fs from "fs";
import * as path from "path";
import cron from "node-cron";

// --- Configuration ---

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "src/data");
const RAW_DIR = process.env.RAW_DIR ?? path.resolve(process.cwd(), "src/scripts/scrapers/raw");
const SCRIPTS_DIR = path.resolve(process.cwd(), "dist/scripts");
const LOCK_FILE = path.join(DATA_DIR, ".update-lock");
const STATUS_FILE = path.join(DATA_DIR, "update-status.json");
const TRIGGER_FILE = path.join(DATA_DIR, ".update-trigger");
const SEED_DATA_DIR = path.resolve(process.cwd(), ".next/standalone/src/data");

// Retry backoff intervals (1h, 4h, 24h)
const RETRY_DELAYS_MS = [3_600_000, 14_400_000, 86_400_000];
const MAX_RETRIES = 3;

// --- Types ---

interface UpdateStatus {
  lastUpdate: string | null;
  nextCheck: string | null;
  status: "idle" | "checking" | "updating" | "error";
  lastResult: {
    success: boolean;
    changelog: { added: string[]; updated: string[]; removed: string[]; unchanged: number };
    duration: number;
    timestamp: string;
  } | null;
  error?: string;
  retryCount: number;
}

// --- State ---

let isUpdating = false;
let retryCount = 0;
const retryTimers: NodeJS.Timeout[] = [];

// --- Helpers ---

/** Parse DATA_UPDATE_INTERVAL env var to cron expression */
function intervalToCron(interval: string): string {
  const cronMap: Record<string, string> = {
    "1d": "0 3 * * *",       // Daily at 3 AM
    "7d": "0 3 * * 0",       // Weekly Sunday 3 AM
    "14d": "0 3 1,15 * *",   // 1st and 15th of month
    "30d": "0 3 1 * *",      // Monthly on 1st
  };
  return cronMap[interval] ?? cronMap["7d"];
}

/** Calculate next cron execution time for display */
function getNextCheckTime(): string {
  // Simple approximation based on interval
  const interval = process.env.DATA_UPDATE_INTERVAL ?? "7d";
  const days = parseInt(interval) || 7;
  const next = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  next.setHours(3, 0, 0, 0);
  return next.toISOString();
}

/** Write update status to disk for the API to read */
function writeStatus(status: UpdateStatus): void {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), "utf-8");
  } catch (err) {
    console.error("[auto-update] Failed to write status file:", err);
  }
}

/** Read current update status */
function readStatus(): UpdateStatus {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
    }
  } catch {
    // Ignore parse errors
  }
  return {
    lastUpdate: null,
    nextCheck: null,
    status: "idle",
    lastResult: null,
    retryCount: 0,
  };
}

/** Run a command as an async child process */
function runCommand(cmd: string, args: string[], env?: Record<string, string>): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, {
      cwd: process.cwd(),
      timeout: 600_000, // 10 minute timeout
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, ...env },
    }, (error, stdout, stderr) => {
      resolve({
        code: error ? (error as NodeJS.ErrnoException & { code?: number }).code ?? 1 : 0,
        stdout: stdout ?? "",
        stderr: stderr ?? "",
      });
    });
  });
}

/** Check Fandom Wiki for recent changes to Division 2 pages */
async function checkForWikiChanges(since: string): Promise<boolean> {
  try {
    const sinceDate = new Date(since).toISOString();
    const apiUrl = `https://thedivision.fandom.com/api.php?action=query&list=recentchanges&rcend=${encodeURIComponent(sinceDate)}&rclimit=10&rcnamespace=0&format=json`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.log(`[auto-update] Wiki API returned ${response.status}, assuming changes exist`);
      return true;
    }

    const data = await response.json() as { query?: { recentchanges?: unknown[] } };
    const changes = data?.query?.recentchanges ?? [];
    console.log(`[auto-update] Wiki reports ${changes.length} recent changes since ${sinceDate}`);
    return changes.length > 0;
  } catch (err) {
    console.error("[auto-update] Wiki change check failed:", err);
    // On error, proceed with update to be safe
    return true;
  }
}

/** Copy seed data from baked image to data volume on first start */
function initializeDataVolume(): void {
  const manifestPath = path.join(DATA_DIR, "manifest.json");

  if (fs.existsSync(manifestPath)) {
    console.log("[auto-update] Data volume already initialized");
    return;
  }

  console.log("[auto-update] First start — copying seed data to data volume...");

  // Ensure data directory exists
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Try multiple possible seed locations
  const seedDirs = [
    SEED_DATA_DIR,
    path.resolve(process.cwd(), "src/data"),
  ];

  for (const seedDir of seedDirs) {
    if (fs.existsSync(seedDir)) {
      const files = fs.readdirSync(seedDir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        fs.copyFileSync(path.join(seedDir, file), path.join(DATA_DIR, file));
      }
      console.log(`[auto-update] Copied ${files.length} seed files from ${seedDir}`);
      return;
    }
  }

  console.warn("[auto-update] No seed data found — scrapers will populate data on first run");
}

/** Clean up stale lock file from a crashed update */
function cleanStaleLock(): void {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const lockTime = fs.statSync(LOCK_FILE).mtimeMs;
      const ageMs = Date.now() - lockTime;
      // If lock is older than 30 minutes, it's stale
      if (ageMs > 30 * 60 * 1000) {
        fs.unlinkSync(LOCK_FILE);
        console.log("[auto-update] Cleaned up stale lock file");
      }
    } catch {
      // Ignore
    }
  }
}

/** Get the age of the current data in milliseconds */
function getDataAgeMs(): number {
  try {
    const manifestPath = path.join(DATA_DIR, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const lastUpdate = new Date(manifest.lastDataUpdate).getTime();
      return Date.now() - lastUpdate;
    }
  } catch {
    // Ignore
  }
  return Infinity;
}

// --- Core Update Logic ---

/** Run the full update pipeline */
async function runUpdate(): Promise<void> {
  if (isUpdating) {
    console.log("[auto-update] Update already in progress, skipping");
    return;
  }

  isUpdating = true;
  fs.writeFileSync(LOCK_FILE, new Date().toISOString(), "utf-8");

  const cronExpression = intervalToCron(process.env.DATA_UPDATE_INTERVAL ?? "7d");
  const status = readStatus();
  status.status = "checking";
  writeStatus(status);

  const startTime = Date.now();

  try {
    // Step 1: Check for wiki changes (skip if first run)
    const manifestPath = path.join(DATA_DIR, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const lastUpdate = manifest.lastDataUpdate ?? new Date(0).toISOString();

      const hasChanges = await checkForWikiChanges(lastUpdate);
      if (!hasChanges) {
        console.log("[auto-update] No wiki changes detected, skipping update");
        status.status = "idle";
        status.nextCheck = getNextCheckTime(cronExpression);
        writeStatus(status);
        isUpdating = false;
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
        return;
      }
    }

    // Step 2: Run scrapers
    status.status = "updating";
    writeStatus(status);
    console.log("[auto-update] Running scrapers...");

    // Ensure raw directory exists
    fs.mkdirSync(RAW_DIR, { recursive: true });

    const scraperScript = path.join(SCRIPTS_DIR, "scrapers/scrape-all.js");
    const scraperCmd = fs.existsSync(scraperScript) ? "node" : "npx";
    const scraperArgs = fs.existsSync(scraperScript)
      ? [scraperScript]
      : ["tsx", path.resolve(process.cwd(), "src/scripts/scrapers/scrape-all.ts")];

    const scraperResult = await runCommand(scraperCmd, scraperArgs, {
      RAW_DIR,
      DATA_DIR,
    });

    console.log(scraperResult.stdout);
    if (scraperResult.stderr) console.error(scraperResult.stderr);

    if (scraperResult.code !== 0) {
      throw new Error(`Scrapers exited with code ${scraperResult.code}`);
    }

    // Step 3: Run merge pipeline
    console.log("[auto-update] Running merge pipeline...");

    const mergeScript = path.join(SCRIPTS_DIR, "transforms/normalize-and-merge.js");
    const mergeCmd = fs.existsSync(mergeScript) ? "node" : "npx";
    const mergeArgs = fs.existsSync(mergeScript)
      ? [mergeScript]
      : ["tsx", path.resolve(process.cwd(), "src/scripts/transforms/normalize-and-merge.ts")];

    const mergeResult = await runCommand(mergeCmd, mergeArgs, {
      RAW_DIR,
      DATA_DIR,
    });

    console.log(mergeResult.stdout);
    if (mergeResult.stderr) console.error(mergeResult.stderr);

    if (mergeResult.code !== 0) {
      throw new Error(`Merge pipeline exited with code ${mergeResult.code}`);
    }

    // Step 4: Clear data cache for hot-reload
    try {
      const { clearDataCache } = await import("./src/lib/data-cache");
      clearDataCache();
      console.log("[auto-update] Data cache cleared — next requests will load fresh data");
    } catch (err) {
      console.warn("[auto-update] Could not clear data cache:", err);
    }

    // Step 5: Read changelog and write success status
    let changelog = { added: [] as string[], updated: [] as string[], removed: [] as string[], unchanged: 0 };
    try {
      const changelogPath = path.join(DATA_DIR, "update-changelog.json");
      if (fs.existsSync(changelogPath)) {
        changelog = JSON.parse(fs.readFileSync(changelogPath, "utf-8"));
      }
    } catch {
      // Ignore
    }

    const duration = Date.now() - startTime;
    status.lastUpdate = new Date().toISOString();
    status.nextCheck = getNextCheckTime(cronExpression);
    status.status = "idle";
    status.lastResult = {
      success: true,
      changelog,
      duration,
      timestamp: new Date().toISOString(),
    };
    status.error = undefined;
    status.retryCount = 0;
    writeStatus(status);

    retryCount = 0;
    console.log(`[auto-update] Update completed successfully in ${(duration / 1000).toFixed(1)}s`);
    console.log(`[auto-update] Added: ${changelog.added.length}, Updated: ${changelog.updated.length}`);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[auto-update] Update failed: ${errorMessage}`);

    const duration = Date.now() - startTime;
    status.status = "error";
    status.error = errorMessage;
    status.retryCount = retryCount;
    status.lastResult = {
      success: false,
      changelog: { added: [], updated: [], removed: [], unchanged: 0 },
      duration,
      timestamp: new Date().toISOString(),
    };
    writeStatus(status);

    // Schedule retry with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[retryCount] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      console.log(`[auto-update] Scheduling retry ${retryCount + 1}/${MAX_RETRIES} in ${delay / 3_600_000}h`);
      retryCount++;
      const timer = setTimeout(() => runUpdate(), delay);
      retryTimers.push(timer);
    } else {
      console.error("[auto-update] Max retries exhausted. Will try again at next scheduled interval.");
      retryCount = 0;
    }
  } finally {
    isUpdating = false;
    if (fs.existsSync(LOCK_FILE)) {
      try { fs.unlinkSync(LOCK_FILE); } catch { /* ignore */ }
    }
  }
}

// --- Exported for API routes ---

/** Get current update status (read by /api/data-status) */
export function getUpdateStatus(): UpdateStatus {
  return readStatus();
}

/** Trigger a manual update (called by /api/data-update) */
export function triggerManualUpdate(): { status: string } {
  if (isUpdating) {
    return { status: "already_running" };
  }
  // Run update without awaiting
  runUpdate();
  return { status: "started" };
}

/** Check if an update is currently running */
export function isUpdateRunning(): boolean {
  return isUpdating;
}

// --- Main Entrypoint ---

async function main(): Promise<void> {
  console.log("=== SHD Planner Server ===");
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`DATA_DIR: ${DATA_DIR}`);
  console.log(`RAW_DIR: ${RAW_DIR}`);

  // Step 1: Initialize data volume (copy seed data on first start)
  initializeDataVolume();

  // Step 2: Clean up stale lock files from crashed updates
  cleanStaleLock();

  // Step 3: Start the Next.js server
  // The standalone server.js sets up the HTTP server
  console.log("[server] Starting Next.js...");
  await import("./server.js" as string);

  // Step 4: Check if data is stale and needs immediate update
  const interval = process.env.DATA_UPDATE_INTERVAL ?? "7d";
  const intervalDays = parseInt(interval) || 7;
  const dataAgeMs = getDataAgeMs();
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

  if (dataAgeMs > intervalMs) {
    console.log(`[auto-update] Data is ${(dataAgeMs / 86_400_000).toFixed(1)} days old (threshold: ${intervalDays}d). Triggering immediate update.`);
    // Delay slightly to let the server fully start
    setTimeout(() => runUpdate(), 10_000);
  }

  // Step 5: Schedule recurring cron job
  const cronExpression = intervalToCron(interval);
  console.log(`[auto-update] Scheduling updates: "${cronExpression}" (interval: ${interval})`);

  cron.schedule(cronExpression, () => {
    console.log(`[auto-update] Cron triggered at ${new Date().toISOString()}`);
    runUpdate();
  });

  // Step 6: Poll for manual trigger file (written by POST /api/data-update)
  const TRIGGER_POLL_MS = 5_000;
  setInterval(() => {
    try {
      if (fs.existsSync(TRIGGER_FILE)) {
        fs.unlinkSync(TRIGGER_FILE);
        console.log("[auto-update] Manual trigger detected via API");
        runUpdate();
      }
    } catch {
      // Ignore — file may have been removed between check and unlink
    }
  }, TRIGGER_POLL_MS);

  // Write initial status
  const status = readStatus();
  if (status.status !== "error") {
    status.status = "idle";
  }
  status.nextCheck = getNextCheckTime(cronExpression);
  writeStatus(status);

  console.log("[server] Ready.");
}

main().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
