/**
 * Google Drive export utilities.
 * Handles uploading builds and game data to a structured Drive folder hierarchy.
 *
 * Folder structure:
 *   SHD-Planner/
 *     Builds/
 *       {buildname}.json
 *       index.json
 *     Game-Data/
 *       manifest.json
 *       ...
 */

import type { IBuild } from "@/lib/types/build";
import { GoogleDriveClient } from "./google-drive";
import { exportBuildAsJSON } from "../sharing/json-export";

// Drive folder names
const ROOT_FOLDER = "SHD-Planner";
const BUILDS_FOLDER = "Builds";
const GAME_DATA_FOLDER = "Game-Data";

// Google Drive web link template
const DRIVE_FILE_URL = "https://drive.google.com/file/d";

/**
 * Ensure the SHD-Planner folder hierarchy exists.
 * Returns the folder IDs for Builds and Game-Data.
 */
async function ensureFolderStructure(
  client: GoogleDriveClient
): Promise<{ rootId: string; buildsId: string; gameDataId: string }> {
  // Find or create root folder
  let rootId = await client.findFolder(ROOT_FOLDER);
  if (!rootId) {
    rootId = await client.createFolder(ROOT_FOLDER);
  }

  // Find or create Builds subfolder
  let buildsId = await client.findFolder(BUILDS_FOLDER, rootId);
  if (!buildsId) {
    buildsId = await client.createFolder(BUILDS_FOLDER, rootId);
  }

  // Find or create Game-Data subfolder
  let gameDataId = await client.findFolder(GAME_DATA_FOLDER, rootId);
  if (!gameDataId) {
    gameDataId = await client.createFolder(GAME_DATA_FOLDER, rootId);
  }

  return { rootId, buildsId, gameDataId };
}

/**
 * Sanitize a build name for use as a filename.
 * Replaces special characters with underscores.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, "").replace(/\s+/g, "_");
}

/**
 * Export a single build to Google Drive.
 * Creates the folder structure if needed and uploads the build JSON.
 * Returns the Drive file URL.
 */
export async function exportBuildToDrive(
  client: GoogleDriveClient,
  build: IBuild
): Promise<string> {
  const { buildsId } = await ensureFolderStructure(client);

  // Serialize and upload
  const json = exportBuildAsJSON(build);
  const filename = `${sanitizeFilename(build.name)}.json`;

  const fileId = await client.uploadFile(
    filename,
    json,
    "application/json",
    buildsId
  );

  return `${DRIVE_FILE_URL}/${fileId}`;
}

/**
 * Export all builds to Google Drive.
 * Uploads each build as a separate JSON file plus an index.json manifest.
 */
export async function exportAllBuildsToDrive(
  client: GoogleDriveClient,
  builds: IBuild[]
): Promise<void> {
  const { buildsId } = await ensureFolderStructure(client);

  // Upload each build
  for (const build of builds) {
    const json = exportBuildAsJSON(build);
    const filename = `${sanitizeFilename(build.name)}.json`;
    await client.uploadFile(filename, json, "application/json", buildsId);
  }

  // Create and upload index manifest
  const index = builds.map((b) => ({
    id: b.id,
    name: b.name,
    specialization: b.specialization,
    dataVersion: b.dataVersion,
    updatedAt: b.updatedAt,
  }));

  await client.uploadFile(
    "index.json",
    JSON.stringify(index, null, 2),
    "application/json",
    buildsId
  );
}

/**
 * Export game data files to Google Drive.
 * Reads JSON files from the data directory and uploads them.
 */
export async function exportGameDataToDrive(
  client: GoogleDriveClient
): Promise<void> {
  const { gameDataId } = await ensureFolderStructure(client);

  // Dynamically import the manifest to discover available data files
  let manifest: Record<string, unknown>;
  try {
    const manifestModule = await import("@/data/manifest.json");
    manifest = manifestModule.default as Record<string, unknown>;
  } catch {
    // If manifest doesn't exist, upload just the manifest
    manifest = {};
  }

  // Upload manifest
  await client.uploadFile(
    "manifest.json",
    JSON.stringify(manifest, null, 2),
    "application/json",
    gameDataId
  );

  // Known data file names to look for in the data directory
  const dataFiles = [
    "brand_sets",
    "gear_sets",
    "named_items",
    "exotics",
    "weapons",
    "weapon_talents",
    "gear_talents",
    "skills",
    "specializations",
  ];

  for (const name of dataFiles) {
    try {
      // Attempt dynamic import of each data file
      const mod = await import(`@/data/${name}.json`);
      const content = JSON.stringify(mod.default, null, 2);
      await client.uploadFile(
        `${name}.json`,
        content,
        "application/json",
        gameDataId
      );
    } catch {
      // Skip files that don't exist yet (data population is ongoing)
      continue;
    }
  }
}
