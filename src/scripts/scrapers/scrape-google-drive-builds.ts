/**
 * scrape-google-drive-builds.ts
 *
 * Scrapes public Google Drive folders for build images/docs metadata.
 * Uses Drive API if GOOGLE_APPLICATION_CREDENTIALS is set.
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { google } from "googleapis";

const OUTPUT_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "raw/builds-guides-raw.json"
);

const BUILD_FOLDERS = [
  process.env.DIV2_BUILDS_FOLDER_ID ?? "1LPnA18PDgGg_dEbNI1kZVTVIMGXNHQS_",
  process.env.DIV2_WEAPON_TABLES_FOLDER_ID ?? "1dBD1oKXzJB1E3bMJtfRNxRHoDCtkkZy8",
  process.env.DIV2_CALC_FOLDER_ID ?? "1TJzpvj5D-I7ANvMH76NZA6iLdSTTOb8_",
].filter(Boolean);

const BUILDS_DOC_ID = process.env.DIV2_BUILDS_DOC_ID ?? "1-nOwUSECa-1iLhET-mW04u6oMBdIdMjFjB2Ie25ziEA";
const GOOGLE_CREDS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

function extractFolderId(urlOrId: string): string {
  if (urlOrId.includes("/folders/")) {
    const m = urlOrId.match(/\/folders\/([^?]+)/);
    if (m) return m[1];
  }
  return urlOrId;
}

function driveThumb(id: string): string {
  return `https://drive.google.com/thumbnail?id=${id}`;
}

function driveFileUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/view`;
}

async function listDriveFolder(folderId: string) {
  if (!GOOGLE_CREDS) throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS");
  const creds = JSON.parse(readFileSync(GOOGLE_CREDS, "utf-8"));
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });
  const items: any[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken, files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink)",
      pageToken,
    });
    items.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return items.map((f) => ({
    id: f.id,
    name: f.name,
    mime: f.mimeType,
    modifiedTime: f.modifiedTime,
    url: f.webViewLink ?? driveFileUrl(f.id!),
    thumbnail: f.thumbnailLink ?? driveThumb(f.id!),
  }));
}

async function main() {
  const folders = BUILD_FOLDERS.map(extractFolderId);
  const outputs: any[] = [];

  for (const folderId of folders) {
    try {
      const items = await listDriveFolder(folderId);
      outputs.push({ folderId, sourceUrl: `https://drive.google.com/drive/folders/${folderId}`, items });
    } catch (err: any) {
      outputs.push({ folderId, error: err?.message ?? String(err) });
    }
  }

  const buildsDocUrl = `https://docs.google.com/document/d/${BUILDS_DOC_ID}/edit`;

  const payload = {
    scrapedAt: new Date().toISOString(),
    sources: {
      buildFolders: outputs,
      buildsDoc: { id: BUILDS_DOC_ID, url: buildsDocUrl },
    },
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
