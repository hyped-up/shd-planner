/**
 * scrape-community-spreadsheet.ts
 *
 * Scrapes the Division 2 community Google Sheets spreadsheet for game data.
 * Fetches sheet data as CSV, parses it, and extracts weapons, gear sets,
 * brand sets, talents, exotics, skills, and named items.
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-community-spreadsheet.ts
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { parse } from "csv-parse/sync";
import { google } from "googleapis";

// --- Types ---

interface SheetInfo {
  name: string;
  gid: string;
  status: "success" | "error";
  rowCount: number;
  error?: string;
}

interface SpreadsheetData {
  source: string;
  scrapedAt: string;
  sheets: SheetInfo[];
  extracted: {
    weapons: Record<string, unknown>[];
    brandSets: Record<string, unknown>[];
    gearSets: Record<string, unknown>[];
    talents: Record<string, unknown>[];
    exotics: Record<string, unknown>[];
    skills: Record<string, unknown>[];
    namedItems: Record<string, unknown>[];
    other: Record<string, unknown>[];
  };
}

// --- Constants ---

const DEFAULT_SHEET_ID = "1nrPBmOrtpkEW1j5fbcRT7L-AXgsGOqMqxXoVtopsiGM";
const SPREADSHEET_ID = process.env.DIV2_SHEET_ID ?? DEFAULT_SHEET_ID;
const RAW_SHEET_URL = process.env.DIV2_SHEET_URL ?? `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`;
const SPREADSHEET_URL = RAW_SHEET_URL.replace(/\/(edit|view).*$/i, "");
const CSV_EXPORT_BASE = `${SPREADSHEET_URL}/export?format=csv`;
const HTML_URL = `${SPREADSHEET_URL}/edit`;
const GOOGLE_CREDS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const PRIMARY_GID = process.env.DIV2_PRIMARY_GID ?? "0";
const STRICT_PRIMARY = (process.env.DIV2_STRICT_PRIMARY ?? "false").toLowerCase() === "true";

// Rate limit delay in milliseconds
const RATE_LIMIT_MS = 1500;

const OUTPUT_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "raw/community-spreadsheet-raw.json"
);

// Known sheet name patterns and their categories
const SHEET_CATEGORY_MAP: Record<string, keyof SpreadsheetData["extracted"]> = {
  weapon: "weapons",
  gun: "weapons",
  brand: "brandSets",
  gear_set: "gearSets",
  gearset: "gearSets",
  "gear set": "gearSets",
  talent: "talents",
  exotic: "exotics",
  skill: "skills",
  named: "namedItems",
};

// --- Helpers ---

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch text from a URL with rate limiting */
async function fetchText(url: string): Promise<string | null> {
  try {
    await sleep(RATE_LIMIT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "shd-planner-scraper/1.0",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`  Fetch error for ${url}: ${err}`);
    return null;
  }
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const v = cell ?? "";
          if (v.includes("\"") || v.includes(",") || v.includes("\n")) {
            return `"${v.replace(/\"/g, '""')}"`;
          }
          return v;
        })
        .join(",")
    )
    .join("\n");
}

async function fetchSheetsViaApi(): Promise<Record<string, string> | null> {
  if (!GOOGLE_CREDS) return null;
  try {
    const creds = JSON.parse(readFileSync(GOOGLE_CREDS, "utf-8"));
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetInfos = meta.data.sheets ?? [];
    const out: Record<string, string> = {};
    for (const s of sheetInfos) {
      const title = s.properties?.title;
      if (!title) continue;
      const values = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: title,
      });
      const rows = (values.data.values as string[][] | undefined) ?? [];
      out[title] = toCsv(rows.map((r) => r.map((c) => (c ?? "").toString())));
    }
    return out;
  } catch (err) {
    return null;
  }
}

/**
 * Discover sheet GIDs by fetching the HTML version of the spreadsheet.
 * Google Sheets embeds sheet names and GIDs in the page HTML.
 */
async function discoverSheets(): Promise<
  { name: string; gid: string }[]
> {
  console.log("Discovering sheet tabs...");
  // Try Sheets API first if creds present
  const apiSheets = await fetchSheetsViaApi();
  if (apiSheets) {
    return Object.keys(apiSheets).map((name, idx) => ({ name, gid: String(idx) }));
  }
  const html = await fetchText(HTML_URL);
  if (!html) {
    console.warn("Could not fetch spreadsheet HTML. Using fallback GIDs.");
    return getFallbackSheets();
  }

  const sheets: { name: string; gid: string }[] = [];

  // Google Sheets embeds sheet info in various formats. Try multiple patterns.

  // Pattern 1: sheet-button elements with data-id attributes
  const sheetButtonRegex =
    /data-id="(\d+)"[^>]*>([^<]+)</g;
  let match: RegExpExecArray | null;
  while ((match = sheetButtonRegex.exec(html)) !== null) {
    sheets.push({ gid: match[1], name: match[2].trim() });
  }

  // Pattern 2: gid= in URLs with sheet names nearby
  if (sheets.length === 0) {
    const gidRegex = /gid=(\d+)/g;
    const gids = new Set<string>();
    while ((match = gidRegex.exec(html)) !== null) {
      gids.add(match[1]);
    }
    // Assign generic names
    let idx = 0;
    for (const gid of gids) {
      sheets.push({ gid, name: `Sheet${idx++}` });
    }
  }

  // Pattern 3: JSON-like sheet info in the page
  if (sheets.length === 0) {
    const jsonRegex = /"name"\s*:\s*"([^"]+)"[^}]*"id"\s*:\s*(\d+)/g;
    while ((match = jsonRegex.exec(html)) !== null) {
      sheets.push({ name: match[1], gid: match[2] });
    }
  }

  if (sheets.length === 0) {
    console.warn("No sheets discovered from HTML. Using fallback GIDs.");
    return getFallbackSheets();
  }

  console.log(`Discovered ${sheets.length} sheet(s):`);
  for (const s of sheets) {
    console.log(`  - ${s.name} (gid=${s.gid})`);
  }

  return sheets;
}

/** Fallback sheet GIDs if discovery fails */
function getFallbackSheets(): { name: string; gid: string }[] {
  return [
    { name: "PrimarySheet", gid: PRIMARY_GID },
  ];
}

/** Determine which extraction category a sheet belongs to based on its name */
function categorizeSheet(
  sheetName: string
): keyof SpreadsheetData["extracted"] {
  const lower = sheetName.toLowerCase();
  for (const [pattern, category] of Object.entries(SHEET_CATEGORY_MAP)) {
    if (lower.includes(pattern)) return category;
  }
  return "other";
}

/** Parse CSV text into an array of row objects using headers from the first row */
function parseCsv(csvText: string): Record<string, string>[] {
  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as Record<string, string>[];
    return records;
  } catch (err) {
    console.error(`  CSV parse error: ${err}`);
    return [];
  }
}

/** Fetch and parse a single sheet by GID */
async function fetchSheet(
  gid: string,
  name: string
): Promise<{ info: SheetInfo; rows: Record<string, string>[] }> {
  const url = `${CSV_EXPORT_BASE}&gid=${gid}`;
  console.log(`Fetching sheet: ${name} (gid=${gid})`);

  const csvText = await fetchText(url);
  if (!csvText) {
    return {
      info: { name, gid, status: "error", rowCount: 0, error: "Fetch failed" },
      rows: [],
    };
  }

  const rows = parseCsv(csvText);
  console.log(`  Parsed ${rows.length} rows`);

  return {
    info: { name, gid, status: "success", rowCount: rows.length },
    rows,
  };
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== Community Spreadsheet Scraper ===");
  console.log(`Source: ${SPREADSHEET_URL}`);
  console.log();

  const result: SpreadsheetData = {
    source: SPREADSHEET_URL,
    scrapedAt: new Date().toISOString(),
    sheets: [],
    extracted: {
      weapons: [],
      brandSets: [],
      gearSets: [],
      talents: [],
      exotics: [],
      skills: [],
      namedItems: [],
      other: [],
    },
  };

  // Discover available sheets
  const sheets = await discoverSheets();
  console.log();

  // Fetch and parse each sheet
  let apiSheetCsv: Record<string, string> | null = null;
  if (GOOGLE_CREDS) {
    apiSheetCsv = await fetchSheetsViaApi();
  }

  for (const sheet of sheets) {
    const csvOverride = apiSheetCsv?.[sheet.name];
    const { info, rows } = csvOverride
      ? {
          info: { name: sheet.name, gid: sheet.gid, status: "success", rowCount: parseCsv(csvOverride).length },
          rows: parseCsv(csvOverride),
        }
      : await fetchSheet(sheet.gid, sheet.name);

    result.sheets.push(info);

    if (sheet.gid === PRIMARY_GID && info.status === "success" && rows.length > 0) {
      primarySheetOk = true;
    }

    if (rows.length === 0) continue;

    // Categorize and store rows
    const category = categorizeSheet(sheet.name);
    for (const row of rows) {
      // Skip rows that are all empty
      const hasData = Object.values(row).some((v) => v && v.trim() !== "");
      if (!hasData) continue;

      result.extracted[category].push({
        _sourceSheet: sheet.name,
        _sourceGid: sheet.gid,
        ...row,
      });
    }
    console.log(
      `  Categorized ${rows.length} rows -> ${category}`
    );
  }

  // Print summary
  console.log();
  console.log("=== Summary ===");
  console.log(`Sheets processed: ${result.sheets.length}`);
  for (const [category, items] of Object.entries(result.extracted)) {
    if (items.length > 0) {
      console.log(`  ${category}: ${items.length} entries`);
    }
  }

  writeOutput(result);
}

/** Write the result to the output JSON file */
function writeOutput(data: SpreadsheetData): void {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log();
  console.log(`Output saved to: ${OUTPUT_PATH}`);
}

// Run the scraper
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
