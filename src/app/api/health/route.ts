// Health check endpoint for Docker and monitoring
// Returns application status, version, and uptime information

import { NextResponse } from "next/server";

// Track when the server started
const startTime = Date.now();

/**
 * GET /api/health
 * Returns a JSON health check response with app version and uptime.
 */
export async function GET() {
  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  return NextResponse.json({
    status: "ok",
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
  });
}
