// Data update status endpoint — returns last update info, next check time, and changelog
// Used by the Settings page to display auto-update status

import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "src/data");
const STATUS_FILE = path.join(DATA_DIR, "update-status.json");
const MANIFEST_FILE = path.join(DATA_DIR, "manifest.json");

/**
 * GET /api/data-status
 * Returns update status, last result, next check time, and changelog.
 */
export async function GET() {
  try {
    // Read update status
    let status = {
      lastUpdate: null as string | null,
      nextCheck: null as string | null,
      status: "idle" as string,
      lastResult: null as {
        success: boolean;
        changelog: { added: string[]; updated: string[]; removed: string[]; unchanged: number };
        duration: number;
        timestamp: string;
      } | null,
      error: undefined as string | undefined,
      retryCount: 0,
    };

    if (fs.existsSync(STATUS_FILE)) {
      status = JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
    }

    // Also read manifest for lastDataUpdate
    let manifestUpdate = null;
    if (fs.existsSync(MANIFEST_FILE)) {
      const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));
      manifestUpdate = manifest.lastDataUpdate;
    }

    return NextResponse.json({
      lastUpdate: status.lastUpdate ?? manifestUpdate,
      nextCheck: status.nextCheck,
      status: status.status,
      lastResult: status.lastResult,
      error: status.error,
      retryCount: status.retryCount,
      // Flag whether app-side auto-updates are available
      autoUpdateAvailable: !!process.env.DATA_DIR && (process.env.ENABLE_APP_SIDE_UPDATES ?? "false").toLowerCase() === "true",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read update status", details: String(err) },
      { status: 500 }
    );
  }
}
