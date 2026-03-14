// Manual data update trigger endpoint — POST to request an update
// Secured via bearer token and basic in-memory rate limiting.

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), "src/data");
const LOCK_FILE = path.join(DATA_DIR, ".update-lock");
const STATUS_FILE = path.join(DATA_DIR, "update-status.json");
const TRIGGER_FILE = path.join(DATA_DIR, ".update-trigger");

const UPDATE_TOKEN = process.env.DATA_UPDATE_TOKEN;
const RATE_LIMIT_WINDOW_MS = Number(process.env.DATA_UPDATE_RATE_WINDOW_MS ?? 60_000);
const RATE_LIMIT_MAX = Number(process.env.DATA_UPDATE_RATE_MAX ?? 5);
const rateLimiter = new Map<string, number[]>();

function isAuthorized(req: NextRequest): boolean {
  if (!UPDATE_TOKEN) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return token.length > 0 && token === UPDATE_TOKEN;
}

function getRequesterKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucket = (rateLimiter.get(key) ?? []).filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);

  if (bucket.length >= RATE_LIMIT_MAX) {
    const oldest = bucket[0];
    const retryAfterSec = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000));
    rateLimiter.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.push(now);
  rateLimiter.set(key, bucket);
  return { allowed: true };
}

/**
 * POST /api/data-update
 * Triggers a manual data update. Returns immediately with status.
 * Note: app-side updater is disabled by default; this only writes a trigger file.
 */
export async function POST(req: NextRequest) {
  if (!process.env.DATA_DIR) {
    return NextResponse.json(
      { status: "unavailable", message: "Data updates are only available in container deployments" },
      { status: 400 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json(
      { status: "unauthorized", message: "Missing or invalid bearer token" },
      { status: 401 }
    );
  }

  const requester = getRequesterKey(req);
  const rate = checkRateLimit(requester);
  if (!rate.allowed) {
    return NextResponse.json(
      { status: "rate_limited", message: "Too many update requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSec ?? 60),
        },
      }
    );
  }

  if (fs.existsSync(LOCK_FILE)) {
    return NextResponse.json(
      { status: "already_running", message: "An update is already in progress" },
      { status: 409 }
    );
  }

  try {
    fs.writeFileSync(TRIGGER_FILE, new Date().toISOString(), "utf-8");

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

    return NextResponse.json({ status: "started", message: "Data update requested" });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "Failed to trigger update", details: String(err) },
      { status: 500 }
    );
  }
}
