/**
 * scrape-mx-builds.ts
 *
 * Scrapes the mx-division-builds GitHub repository for game data files.
 * Fetches raw source files from the repo and extracts gear, weapon, talent,
 * skill, and other item data from JSON/TS/JS files.
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-mx-builds.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

// --- Types ---

interface MxBuildData {
  source: string;
  scrapedAt: string;
  files: FileEntry[];
  extracted: {
    brandSets: Record<string, unknown>[];
    gearSets: Record<string, unknown>[];
    weapons: Record<string, unknown>[];
    talents: Record<string, unknown>[];
    skills: Record<string, unknown>[];
    namedItems: Record<string, unknown>[];
    exotics: Record<string, unknown>[];
    other: Record<string, unknown>[];
  };
}

interface FileEntry {
  path: string;
  url: string;
  status: "success" | "error";
  matchedKeywords: string[];
  error?: string;
}

// --- Constants ---

const REPO_OWNER = "mxswat";
const REPO_NAME = "mx-division-builds";
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master`;

// Keywords to look for in file content
const DATA_KEYWORDS = [
  "brandSet",
  "brand_set",
  "gearSet",
  "gear_set",
  "exotic",
  "talent",
  "weapon",
  "skill",
  "namedItem",
  "named_item",
] as const;

// File extensions to check
const TARGET_EXTENSIONS = [".json", ".ts", ".js"];

// Rate limit delay in milliseconds
const RATE_LIMIT_MS = 1000;

const OUTPUT_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "raw/mx-builds-raw.json"
);

// --- Helpers ---

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch with error handling and rate limiting */
async function fetchWithDelay(url: string): Promise<Response> {
  await sleep(RATE_LIMIT_MS);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "shd-planner-scraper/1.0",
      Accept: "application/vnd.github.v3+json",
    },
  });
  return res;
}

/** Fetch plain text content from a raw GitHub URL */
async function fetchRawContent(url: string): Promise<string | null> {
  try {
    await sleep(RATE_LIMIT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": "shd-planner-scraper/1.0" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`  Error fetching ${url}: ${err}`);
    return null;
  }
}

/** Check if content contains any of the data keywords */
function findKeywords(content: string): string[] {
  const lowerContent = content.toLowerCase();
  return DATA_KEYWORDS.filter((kw) => lowerContent.includes(kw.toLowerCase()));
}

/** Try to parse content as JSON, returning the parsed object or null */
function tryParseJson(content: string): unknown | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Categorize extracted data based on keywords found.
 * Returns the category name for sorting into the extracted buckets.
 */
function categorize(
  keywords: string[]
): keyof MxBuildData["extracted"] {
  const joined = keywords.join(",").toLowerCase();
  if (joined.includes("brand")) return "brandSets";
  if (joined.includes("gear_set") || joined.includes("gearset"))
    return "gearSets";
  if (joined.includes("exotic")) return "exotics";
  if (joined.includes("named")) return "namedItems";
  if (joined.includes("talent")) return "talents";
  if (joined.includes("weapon")) return "weapons";
  if (joined.includes("skill")) return "skills";
  return "other";
}

// --- Tree fetching ---

interface GitHubTreeItem {
  path: string;
  type: string;
  sha: string;
  url: string;
}

/** Fetch the full file tree from the GitHub API */
async function fetchRepoTree(): Promise<GitHubTreeItem[]> {
  console.log("Fetching repository tree...");
  const url = `${GITHUB_API_BASE}/git/trees/master?recursive=1`;
  const res = await fetchWithDelay(url);

  if (!res.ok) {
    console.error(`Failed to fetch repo tree: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = (await res.json()) as { tree: GitHubTreeItem[] };
  return data.tree || [];
}

/** Filter tree items to only data-relevant source files in src/ and public/ */
function filterDataFiles(tree: GitHubTreeItem[]): GitHubTreeItem[] {
  return tree.filter((item) => {
    if (item.type !== "blob") return false;
    const ext = item.path.substring(item.path.lastIndexOf("."));
    if (!TARGET_EXTENSIONS.includes(ext)) return false;
    // Only look in src/ and public/ directories
    if (!item.path.startsWith("src/") && !item.path.startsWith("public/"))
      return false;
    // Skip test files, config files, and build artifacts
    if (
      item.path.includes(".test.") ||
      item.path.includes(".spec.") ||
      item.path.includes("node_modules")
    )
      return false;
    return true;
  });
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== MX Division Builds Scraper ===");
  console.log(`Source: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
  console.log();

  const result: MxBuildData = {
    source: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
    scrapedAt: new Date().toISOString(),
    files: [],
    extracted: {
      brandSets: [],
      gearSets: [],
      weapons: [],
      talents: [],
      skills: [],
      namedItems: [],
      exotics: [],
      other: [],
    },
  };

  // Fetch the repo file tree
  const tree = await fetchRepoTree();
  if (tree.length === 0) {
    console.error("No files found in repository tree. Exiting.");
    writeOutput(result);
    return;
  }

  console.log(`Total files in repo: ${tree.length}`);

  // Filter to data-relevant files
  const dataFiles = filterDataFiles(tree);
  console.log(
    `Candidate data files (src/ and public/, .json/.ts/.js): ${dataFiles.length}`
  );
  console.log();

  // Fetch and analyze each candidate file
  for (const file of dataFiles) {
    const rawUrl = `${RAW_CONTENT_BASE}/${file.path}`;
    console.log(`Checking: ${file.path}`);

    const content = await fetchRawContent(rawUrl);
    if (!content) {
      result.files.push({
        path: file.path,
        url: rawUrl,
        status: "error",
        matchedKeywords: [],
        error: "Failed to fetch content",
      });
      continue;
    }

    const matchedKeywords = findKeywords(content);
    if (matchedKeywords.length === 0) {
      // Skip files with no relevant keywords (don't log them)
      continue;
    }

    console.log(`  Found keywords: ${matchedKeywords.join(", ")}`);

    const entry: FileEntry = {
      path: file.path,
      url: rawUrl,
      status: "success",
      matchedKeywords,
    };
    result.files.push(entry);

    // Try to extract structured data
    const parsed = tryParseJson(content);
    const category = categorize(matchedKeywords);

    if (parsed && typeof parsed === "object") {
      // If parsed is an array, add each item; otherwise add the whole object
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          result.extracted[category].push({
            _sourceFile: file.path,
            ...(typeof item === "object" && item !== null ? item : { value: item }),
          } as Record<string, unknown>);
        }
      } else {
        result.extracted[category].push({
          _sourceFile: file.path,
          ...parsed,
        } as Record<string, unknown>);
      }
      console.log(
        `  Extracted ${Array.isArray(parsed) ? parsed.length : 1} entries -> ${category}`
      );
    } else {
      // For TS/JS files, store a reference with the raw content snippet
      result.extracted[category].push({
        _sourceFile: file.path,
        _type: "raw_source",
        _contentPreview: content.substring(0, 500),
        _contentLength: content.length,
      });
      console.log(`  Stored raw source reference -> ${category}`);
    }
  }

  // Print summary
  console.log();
  console.log("=== Summary ===");
  console.log(`Files with matching keywords: ${result.files.length}`);
  for (const [category, items] of Object.entries(result.extracted)) {
    if (items.length > 0) {
      console.log(`  ${category}: ${items.length} entries`);
    }
  }

  writeOutput(result);
}

/** Write the result to the output JSON file */
function writeOutput(data: MxBuildData): void {
  // Ensure output directory exists
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
