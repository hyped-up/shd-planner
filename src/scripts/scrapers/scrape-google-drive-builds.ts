/**
 * scrape-google-drive-builds.ts
 *
 * Scrapes public Google Drive folders for build images/docs metadata.
 * Outputs raw/builds-guides-raw.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

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

function extractFolderId(urlOrId: string): string {
  if (urlOrId.includes("/folders/")) {
    const m = urlOrId.match(/\/folders\/([^?]+)/);
    if (m) return m[1];
  }
  return urlOrId;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseDriveFolder(html: string): Array<{ id: string; name: string; mime: string }>{
  // Very simple heuristic parsing for public Drive folder pages.
  const results: Array<{ id: string; name: string; mime: string }> = [];
  const re = /\["([a-zA-Z0-9_-]{10,})",\["([^"]+)"\],[^\]]*\],\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const id = m[1];
    const name = m[2];
    const mime = m[3];
    if (!results.find((r) => r.id === id)) results.push({ id, name, mime });
  }
  return results;
}

function driveThumb(id: string): string {
  return `https://drive.google.com/thumbnail?id=${id}`;
}

function driveFileUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/view`;
}

async function main() {
  const folders = BUILD_FOLDERS.map(extractFolderId);
  const outputs: any[] = [];

  for (const folderId of folders) {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    try {
      const html = await fetchText(url);
      const items = parseDriveFolder(html).map((item) => ({
        ...item,
        url: driveFileUrl(item.id),
        thumbnail: driveThumb(item.id),
        folderId,
      }));
      outputs.push({ folderId, sourceUrl: url, items });
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
