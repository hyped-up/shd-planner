// Manual data update trigger endpoint — POST to start an update
// Only available in Docker deployments with DATA_DIR configured

import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "src/data");
const LOCK_FILE = path.join(DATA_DIR, ".update-lock");
const STATUS_FILE = path.join(DATA_DIR, "update-status.json");

/**
 * POST /api/data-update
 * Triggers a manual data update. Returns immediately with status.
 * The actual update runs asynchronously in the server.ts cron handler.
 */
export async function POST() {
  // Only allow in Docker deployments
  if (!process.env.DATA_DIR) {
    return NextResponse.json(
      { status: "unavailable", message: "Auto-updates are only available in Docker deployments" },
      { status: 400 }
    );
  }

  // Check if update is already running
  if (fs.existsSync(LOCK_FILE)) {
    return NextResponse.json(
      { status: "already_running", message: "An update is already in progress" },
      { status: 409 }
    );
  }

  try {
    // Signal the server.ts cron handler by writing a trigger file
    const triggerFile = path.join(DATA_DIR, ".update-trigger");
    fs.writeFileSync(triggerFile, new Date().toISOString(), "utf-8");

    // Update status to reflect the manual trigger
    const status = {
      lastUpdate: null as string | null,
      nextCheck: null as string | null,
      status: "checking",
      lastResult: null,
      retryCount: 0,
    };

    if (fs.existsSync(STATUS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
      status.lastUpdate = existing.lastUpdate;
      status.nextCheck = existing.nextCheck;
      status.lastResult = existing.lastResult;
    }

    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), "utf-8");

    return NextResponse.json({ status: "started", message: "Data update triggered" });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "Failed to trigger update", details: String(err) },
      { status: 500 }
    );
  }
}
