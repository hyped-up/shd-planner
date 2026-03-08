/**
 * Google Drive import utilities.
 * Lists and downloads builds from the SHD-Planner Drive folder.
 */

import type { IBuild } from "@/lib/types/build";
import { GoogleDriveClient } from "./google-drive";
import { importBuildFromJSON } from "../sharing/json-export";

// Drive folder names (must match drive-export.ts)
const ROOT_FOLDER = "SHD-Planner";
const BUILDS_FOLDER = "Builds";

/** Summary of a build stored on Google Drive */
export interface IDriveBuildEntry {
  id: string;
  name: string;
  modified: string;
}

/**
 * List all build files stored in the SHD-Planner/Builds/ folder on Drive.
 * Returns file metadata excluding index.json.
 */
export async function listDriveBuilds(
  client: GoogleDriveClient
): Promise<IDriveBuildEntry[]> {
  // Find the folder hierarchy
  const rootId = await client.findFolder(ROOT_FOLDER);
  if (!rootId) {
    return [];
  }

  const buildsId = await client.findFolder(BUILDS_FOLDER, rootId);
  if (!buildsId) {
    return [];
  }

  // List all JSON files in the Builds folder
  const files = await client.listFiles(buildsId);

  // Filter out the index.json and map to simplified format
  return files
    .filter((f) => f.name !== "index.json" && f.name.endsWith(".json"))
    .map((f) => ({
      id: f.id,
      name: f.name.replace(/\.json$/, ""),
      modified: f.modifiedTime,
    }));
}

/**
 * Import a single build from Google Drive by file ID.
 * Downloads the file content and parses it as a build.
 * Returns the parsed IBuild or null if the file is invalid.
 */
export async function importBuildFromDrive(
  client: GoogleDriveClient,
  fileId: string
): Promise<IBuild | null> {
  try {
    const content = await client.downloadFile(fileId);
    const result = importBuildFromJSON(content);

    if (result.errors.length > 0) {
      console.warn("Build import warnings:", result.errors);
    }

    return result.build;
  } catch (err) {
    console.error("Failed to import build from Drive:", err);
    return null;
  }
}
