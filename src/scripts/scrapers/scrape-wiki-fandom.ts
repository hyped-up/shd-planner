/**
 * scrape-wiki-fandom.ts
 *
 * Scrapes the Division 2 Fandom wiki using the MediaWiki API.
 * Fetches pages for gear, weapons, talents, and other game data.
 * Extracts supplementary information like lore, obtain methods,
 * and Dark Zone exclusives.
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-wiki-fandom.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

// --- Types ---

interface WikiPage {
  title: string;
  pageId: number;
  status: "success" | "error";
  wikitext?: string;
  error?: string;
}

interface WikiExtractedItem {
  name: string;
  sourcePageTitle: string;
  type: string;
  lore?: string;
  obtainMethod?: string;
  isDarkZoneExclusive?: boolean;
  stats: Record<string, string>;
  rawWikitextSnippet?: string;
}

interface WikiData {
  source: string;
  scrapedAt: string;
  pagesScraped: number;
  pageErrors: string[];
  extracted: {
    weapons: WikiExtractedItem[];
    gear: WikiExtractedItem[];
    gearSets: WikiExtractedItem[];
    brandSets: WikiExtractedItem[];
    exotics: WikiExtractedItem[];
    talents: WikiExtractedItem[];
    skills: WikiExtractedItem[];
    namedItems: WikiExtractedItem[];
    other: WikiExtractedItem[];
  };
}

// --- Constants ---

const WIKI_API = "https://thedivision.fandom.com/api.php";

// Pages and categories to fetch from the wiki
const TARGET_PAGES = [
  // Category pages
  "Category:Tom_Clancy's_The_Division_2_Weapons",
  "Category:Tom_Clancy's_The_Division_2_Gear",
  "Category:Tom_Clancy's_The_Division_2_Gear_Sets",
  "Category:Tom_Clancy's_The_Division_2_Brand_Sets",
  "Category:Tom_Clancy's_The_Division_2_Exotic_Items",
  "Category:Tom_Clancy's_The_Division_2_Talents",
  "Category:Tom_Clancy's_The_Division_2_Skills",
  "Category:Tom_Clancy's_The_Division_2_Named_Items",
  // Direct pages
  "Weapons_(Tom_Clancy's_The_Division_2)",
  "Gear_Sets_(Tom_Clancy's_The_Division_2)",
  "Brand_Sets_(Tom_Clancy's_The_Division_2)",
  "Exotic_(Tom_Clancy's_The_Division_2)",
  "Talents_(Tom_Clancy's_The_Division_2)",
  "Skills_(Tom_Clancy's_The_Division_2)",
  "Named_Items_(Tom_Clancy's_The_Division_2)",
  "Dark_Zone_(Tom_Clancy's_The_Division_2)",
];

// Rate limit delay in milliseconds
const RATE_LIMIT_MS = 1500;

const OUTPUT_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "raw/wiki-raw.json"
);

// --- Helpers ---

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Build a MediaWiki API URL with the given parameters */
function buildApiUrl(params: Record<string, string>): string {
  const url = new URL(WIKI_API);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Fetch JSON from the MediaWiki API with rate limiting */
async function fetchApi(
  params: Record<string, string>
): Promise<Record<string, unknown> | null> {
  const url = buildApiUrl(params);
  try {
    await sleep(RATE_LIMIT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "shd-planner-scraper/1.0 (Division 2 build tool)",
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.error(`  API error: ${res.status} ${res.statusText}`);
      return null;
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error(`  Fetch error: ${err}`);
    return null;
  }
}

/** Fetch page wikitext via the parse API */
async function fetchPageWikitext(title: string): Promise<WikiPage> {
  console.log(`  Fetching page: ${title}`);
  const data = await fetchApi({
    action: "parse",
    page: title,
    prop: "wikitext",
    redirects: "1",
  });

  if (!data || !data.parse) {
    return {
      title,
      pageId: 0,
      status: "error",
      error: data?.error
        ? String((data.error as Record<string, unknown>).info || "Unknown error")
        : "No parse data returned",
    };
  }

  const parseData = data.parse as Record<string, unknown>;
  const wikitext = parseData.wikitext as Record<string, string> | undefined;

  return {
    title,
    pageId: (parseData.pageid as number) || 0,
    status: "success",
    wikitext: wikitext?.["*"] || "",
  };
}

/** List pages in a category via the API */
async function fetchCategoryMembers(
  category: string
): Promise<string[]> {
  console.log(`  Listing category: ${category}`);
  const members: string[] = [];
  let cmcontinue: string | undefined;

  // Paginate through category members
  do {
    const params: Record<string, string> = {
      action: "query",
      list: "categorymembers",
      cmtitle: category,
      cmlimit: "50",
      cmtype: "page",
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    const data = await fetchApi(params);
    if (!data || !data.query) break;

    const query = data.query as Record<string, unknown>;
    const cmembers = query.categorymembers as
      | { title: string }[]
      | undefined;

    if (cmembers) {
      for (const m of cmembers) {
        members.push(m.title);
      }
    }

    // Check for continuation
    const cont = data.continue as Record<string, string> | undefined;
    cmcontinue = cont?.cmcontinue;
  } while (cmcontinue);

  console.log(`    Found ${members.length} pages in category`);
  return members;
}

/** Determine extraction category from a page title or category name */
function categorizeTitle(
  title: string
): keyof WikiData["extracted"] {
  const lower = title.toLowerCase();
  if (lower.includes("weapon") || lower.includes("gun")) return "weapons";
  if (lower.includes("gear_set") || lower.includes("gear set"))
    return "gearSets";
  if (lower.includes("brand_set") || lower.includes("brand set"))
    return "brandSets";
  if (lower.includes("exotic")) return "exotics";
  if (lower.includes("named_item") || lower.includes("named item"))
    return "namedItems";
  if (lower.includes("talent")) return "talents";
  if (lower.includes("skill")) return "skills";
  if (lower.includes("gear")) return "gear";
  return "other";
}

/** Extract structured data from wikitext */
function extractFromWikitext(
  wikitext: string,
  pageTitle: string,
  category: keyof WikiData["extracted"]
): WikiExtractedItem[] {
  const items: WikiExtractedItem[] = [];

  // Check for Dark Zone exclusive mentions
  const isDZ =
    wikitext.toLowerCase().includes("dark zone") &&
    (wikitext.toLowerCase().includes("exclusive") ||
      wikitext.toLowerCase().includes("only"));

  // Extract infobox data (common wiki template pattern)
  const infoboxRegex =
    /\{\{[Ii]nfobox[^}]*\|([^}]+)\}\}/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoboxRegex.exec(wikitext)) !== null) {
    const item = parseInfobox(infoMatch[1], pageTitle, category, isDZ);
    if (item) items.push(item);
  }

  // Extract items from wiki tables
  const tableItems = extractFromWikiTables(wikitext, pageTitle, category, isDZ);
  items.push(...tableItems);

  // Extract items from section headers (== Item Name ==)
  const sectionItems = extractFromSections(
    wikitext,
    pageTitle,
    category,
    isDZ
  );

  // Only add section items if we didn't get them from infoboxes or tables
  if (items.length === 0) {
    items.push(...sectionItems);
  }

  // If no structured data found, create a single entry for the whole page
  if (items.length === 0) {
    // Extract any lore text (usually first paragraph)
    const loreMatch = wikitext.match(/^(?!\{|\[|=|\||\*)(.{20,500}?)(?:\n\n|\n=)/m);

    items.push({
      name: pageTitle.replace(/_/g, " ").replace(/\s*\(.*\)$/, ""),
      sourcePageTitle: pageTitle,
      type: category,
      lore: loreMatch ? cleanWikitext(loreMatch[1]) : undefined,
      isDarkZoneExclusive: isDZ,
      stats: {},
      rawWikitextSnippet: wikitext.substring(0, 800),
    });
  }

  return items;
}

/** Parse an infobox template into an extracted item */
function parseInfobox(
  content: string,
  pageTitle: string,
  category: string,
  isDZ: boolean
): WikiExtractedItem | null {
  const stats: Record<string, string> = {};
  let name = pageTitle.replace(/_/g, " ").replace(/\s*\(.*\)$/, "");

  // Parse key=value pairs from the infobox
  const paramRegex = /\|\s*(\w+)\s*=\s*([^\n|]+)/g;
  let match: RegExpExecArray | null;
  while ((match = paramRegex.exec(content)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = cleanWikitext(match[2].trim());

    if (key === "name" || key === "title") {
      name = value;
    } else if (value) {
      stats[key] = value;
    }
  }

  return {
    name,
    sourcePageTitle: pageTitle,
    type: category,
    isDarkZoneExclusive: isDZ,
    stats,
  };
}

/** Extract items from wiki table markup */
function extractFromWikiTables(
  wikitext: string,
  pageTitle: string,
  category: keyof WikiData["extracted"],
  isDZ: boolean
): WikiExtractedItem[] {
  const items: WikiExtractedItem[] = [];

  // Match wiki table blocks
  const tableRegex = /\{\|[^]*?\|\}/g;
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRegex.exec(wikitext)) !== null) {
    const tableText = tableMatch[0];
    const rows = tableText.split("|-");

    // Try to find header row
    let headers: string[] = [];
    if (rows.length > 1) {
      const headerCells = rows[0].match(/!\s*([^\n!|]+)/g);
      if (headerCells) {
        headers = headerCells.map((h) =>
          cleanWikitext(h.replace(/^!\s*/, "").trim()).toLowerCase()
        );
      }
    }

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].match(/\|\s*([^\n|]+)/g);
      if (!cells || cells.length === 0) continue;

      const cleanCells = cells.map((c) =>
        cleanWikitext(c.replace(/^\|\s*/, "").trim())
      );

      if (cleanCells.every((c) => !c)) continue;

      const item: WikiExtractedItem = {
        name: cleanCells[0] || "Unknown",
        sourcePageTitle: pageTitle,
        type: category,
        isDarkZoneExclusive: isDZ,
        stats: {},
      };

      headers.forEach((header, idx) => {
        if (idx < cleanCells.length && cleanCells[idx]) {
          if (header.includes("name")) {
            item.name = cleanCells[idx];
          } else {
            item.stats[header] = cleanCells[idx];
          }
        }
      });

      items.push(item);
    }
  }

  return items;
}

/** Extract items from section headers in wikitext */
function extractFromSections(
  wikitext: string,
  pageTitle: string,
  category: keyof WikiData["extracted"],
  isDZ: boolean
): WikiExtractedItem[] {
  const items: WikiExtractedItem[] = [];

  // Match level 2 and 3 section headers
  const sectionRegex = /^(={2,3})\s*(.+?)\s*\1\s*\n([\s\S]*?)(?=^={2,3}\s|\z)/gm;
  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(wikitext)) !== null) {
    const sectionName = cleanWikitext(match[2]).trim();
    const sectionContent = match[3];

    // Skip meta sections
    if (
      ["references", "see also", "external links", "trivia", "gallery", "notes"].includes(
        sectionName.toLowerCase()
      )
    )
      continue;

    // Extract first paragraph as potential lore
    const firstParagraph = sectionContent
      .split("\n\n")[0]
      ?.replace(/\n/g, " ")
      .trim();

    if (sectionName.length > 2 && sectionName.length < 100) {
      items.push({
        name: sectionName,
        sourcePageTitle: pageTitle,
        type: category,
        lore: firstParagraph ? cleanWikitext(firstParagraph) : undefined,
        isDarkZoneExclusive: isDZ,
        stats: {},
      });
    }
  }

  return items;
}

/** Clean wikitext markup from a string */
function cleanWikitext(text: string): string {
  return text
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1") // [[link|text]] -> text
    .replace(/\{\{[^}]*\}\}/g, "") // remove templates
    .replace(/<[^>]+>/g, "") // remove HTML tags
    .replace(/'{2,3}/g, "") // remove bold/italic markers
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== Wiki / Fandom Scraper ===");
  console.log(`Source: ${WIKI_API}`);
  console.log();

  const result: WikiData = {
    source: WIKI_API,
    scrapedAt: new Date().toISOString(),
    pagesScraped: 0,
    pageErrors: [],
    extracted: {
      weapons: [],
      gear: [],
      gearSets: [],
      brandSets: [],
      exotics: [],
      talents: [],
      skills: [],
      namedItems: [],
      other: [],
    },
  };

  // Collect all pages to fetch (from categories + direct pages)
  const allPages = new Set<string>();
  const pageCategoryMap = new Map<string, keyof WikiData["extracted"]>();

  // Process target pages — fetch category members for category pages,
  // add direct pages to the fetch list
  for (const target of TARGET_PAGES) {
    const category = categorizeTitle(target);

    if (target.startsWith("Category:")) {
      console.log(`Processing category: ${target}`);
      const members = await fetchCategoryMembers(target);
      for (const member of members) {
        // Skip sub-categories
        if (member.startsWith("Category:")) continue;
        allPages.add(member);
        pageCategoryMap.set(member, category);
      }
    } else {
      allPages.add(target);
      pageCategoryMap.set(target, category);
    }
  }

  console.log();
  console.log(`Total unique pages to fetch: ${allPages.size}`);
  console.log();

  // Fetch and parse each page
  for (const pageTitle of allPages) {
    const page = await fetchPageWikitext(pageTitle);

    if (page.status === "error") {
      result.pageErrors.push(`${pageTitle}: ${page.error}`);
      console.warn(`  Error: ${page.error}`);
      continue;
    }

    result.pagesScraped++;

    if (!page.wikitext || page.wikitext.trim().length === 0) {
      console.log(`  Empty wikitext, skipping`);
      continue;
    }

    const category = pageCategoryMap.get(pageTitle) || "other";
    const items = extractFromWikitext(page.wikitext, pageTitle, category);

    if (items.length > 0) {
      result.extracted[category].push(...items);
      console.log(`  Extracted ${items.length} items -> ${category}`);
    }
  }

  // Print summary
  console.log();
  console.log("=== Summary ===");
  console.log(`Pages scraped: ${result.pagesScraped}`);
  console.log(`Page errors: ${result.pageErrors.length}`);
  for (const [category, items] of Object.entries(result.extracted)) {
    if (items.length > 0) {
      console.log(`  ${category}: ${items.length} items`);
    }
  }

  writeOutput(result);
}

/** Write the result to the output JSON file */
function writeOutput(data: WikiData): void {
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
