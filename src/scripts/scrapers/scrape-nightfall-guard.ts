/**
 * scrape-nightfall-guard.ts
 *
 * Scrapes the Nightfall Guard Division 2 database for item data.
 * Fetches the main database page and sub-category pages, parses HTML
 * with cheerio, and extracts item names, stats, talents, and metadata.
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-nightfall-guard.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import * as cheerio from "cheerio";

// --- Types ---

interface NightfallItem {
  name: string;
  category: string;
  subcategory?: string;
  slot?: string;
  stats: Record<string, string>;
  talent?: string;
  talentDescription?: string;
  obtainMethod?: string;
  sourceUrl: string;
}

interface NightfallData {
  source: string;
  scrapedAt: string;
  pagesScraped: number;
  pageErrors: string[];
  extracted: {
    weapons: NightfallItem[];
    gear: NightfallItem[];
    gearSets: NightfallItem[];
    brandSets: NightfallItem[];
    exotics: NightfallItem[];
    talents: NightfallItem[];
    skills: NightfallItem[];
    other: NightfallItem[];
  };
}

// --- Constants ---

const BASE_URL = "https://www.nightfallguard.com";
const DATABASE_URL = `${BASE_URL}/thedivision2/database`;

// Known sub-category paths to try
const SUB_PAGES = [
  "/thedivision2/database/weapons",
  "/thedivision2/database/gear",
  "/thedivision2/database/gear-sets",
  "/thedivision2/database/brand-sets",
  "/thedivision2/database/exotics",
  "/thedivision2/database/talents",
  "/thedivision2/database/skills",
  "/thedivision2/database/named-items",
  "/thedivision2/database/specializations",
  "/thedivision2/database/mods",
];

// Rate limit delay in milliseconds
const RATE_LIMIT_MS = 1500;

const OUTPUT_PATH = resolve(
  dirname(new URL(import.meta.url).pathname),
  "raw/nightfall-guard-raw.json"
);

// --- Helpers ---

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch HTML from a URL with rate limiting */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    await sleep(RATE_LIMIT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; shd-planner-scraper/1.0)",
        Accept: "text/html,application/xhtml+xml",
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

/** Determine the extraction category from a page path */
function categoryFromPath(
  path: string
): keyof NightfallData["extracted"] {
  const lower = path.toLowerCase();
  if (lower.includes("weapon")) return "weapons";
  if (lower.includes("gear-set")) return "gearSets";
  if (lower.includes("brand-set")) return "brandSets";
  if (lower.includes("exotic")) return "exotics";
  if (lower.includes("talent")) return "talents";
  if (lower.includes("skill")) return "skills";
  if (lower.includes("gear") || lower.includes("named")) return "gear";
  return "other";
}

/** Extract items from a cheerio-parsed page */
function extractItemsFromPage(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  category: keyof NightfallData["extracted"]
): NightfallItem[] {
  const items: NightfallItem[] = [];

  // Strategy 1: Look for table rows with item data
  $("table").each((_tableIdx, table) => {
    const headers: string[] = [];
    $(table)
      .find("thead th, tr:first-child th, tr:first-child td")
      .each((_i, el) => {
        headers.push($(el).text().trim().toLowerCase());
      });

    // Skip tables without recognizable headers
    if (headers.length === 0) return;

    $(table)
      .find("tbody tr, tr:not(:first-child)")
      .each((_i, row) => {
        const cells: string[] = [];
        $(row)
          .find("td")
          .each((_j, cell) => {
            cells.push($(cell).text().trim());
          });

        if (cells.length === 0 || cells.every((c) => !c)) return;

        const item: NightfallItem = {
          name: cells[0] || "Unknown",
          category: category,
          stats: {},
          sourceUrl: pageUrl,
        };

        // Map cells to headers
        headers.forEach((header, idx) => {
          if (idx < cells.length && cells[idx]) {
            if (header.includes("name")) {
              item.name = cells[idx];
            } else if (header.includes("talent")) {
              item.talent = cells[idx];
            } else if (header.includes("slot") || header.includes("type")) {
              item.slot = cells[idx];
            } else if (header.includes("obtain") || header.includes("source")) {
              item.obtainMethod = cells[idx];
            } else if (header.includes("description")) {
              item.talentDescription = cells[idx];
            } else {
              item.stats[header] = cells[idx];
            }
          }
        });

        items.push(item);
      });
  });

  // Strategy 2: Look for card/list-based layouts
  if (items.length === 0) {
    // Common patterns for item cards on game database sites
    $(
      ".item-card, .card, .item, [class*='item'], [class*='card'], article"
    ).each((_i, el) => {
      const name =
        $(el).find("h2, h3, h4, .title, .name, [class*='name']").first().text().trim() ||
        $(el).find("a").first().text().trim();

      if (!name) return;

      const item: NightfallItem = {
        name,
        category: category,
        stats: {},
        sourceUrl: pageUrl,
      };

      // Try to extract additional details from the card
      const talent = $(el)
        .find("[class*='talent'], .talent, .perk")
        .first()
        .text()
        .trim();
      if (talent) item.talent = talent;

      const desc = $(el)
        .find("[class*='description'], .desc, p")
        .first()
        .text()
        .trim();
      if (desc) item.talentDescription = desc;

      const slot = $(el)
        .find("[class*='slot'], [class*='type'], .type")
        .first()
        .text()
        .trim();
      if (slot) item.slot = slot;

      items.push(item);
    });
  }

  // Strategy 3: Look for lists of links (common for database index pages)
  if (items.length === 0) {
    $("ul li a, .list a, .database-list a").each((_i, el) => {
      const name = $(el).text().trim();
      if (!name || name.length < 2) return;

      items.push({
        name,
        category: category,
        stats: {},
        sourceUrl: pageUrl,
      });
    });
  }

  return items;
}

/** Discover sub-page links from the main database page */
function discoverSubPages(
  $: cheerio.CheerioAPI
): string[] {
  const links: string[] = [];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    // Only include links within the database section
    if (
      href.includes("/thedivision2/database") &&
      href !== "/thedivision2/database" &&
      !href.includes("#")
    ) {
      // Normalize to full URL
      const fullUrl = href.startsWith("http")
        ? href
        : `${BASE_URL}${href.startsWith("/") ? href : "/" + href}`;

      if (!links.includes(fullUrl)) {
        links.push(fullUrl);
      }
    }
  });

  return links;
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== Nightfall Guard Scraper ===");
  console.log(`Source: ${DATABASE_URL}`);
  console.log();

  const result: NightfallData = {
    source: DATABASE_URL,
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
      other: [],
    },
  };

  // Fetch the main database page
  console.log("Fetching main database page...");
  const mainHtml = await fetchHtml(DATABASE_URL);

  // Collect all pages to scrape
  const pagesToScrape = new Set<string>();

  // Add known sub-pages
  for (const path of SUB_PAGES) {
    pagesToScrape.add(`${BASE_URL}${path}`);
  }

  // Discover additional sub-pages from the main page
  if (mainHtml) {
    result.pagesScraped++;
    const $ = cheerio.load(mainHtml);
    const discovered = discoverSubPages($);
    console.log(`Discovered ${discovered.length} sub-page links from main page`);
    for (const link of discovered) {
      pagesToScrape.add(link);
    }

    // Also extract items from the main page itself
    const mainItems = extractItemsFromPage($, DATABASE_URL, "other");
    if (mainItems.length > 0) {
      console.log(`  Extracted ${mainItems.length} items from main page`);
      result.extracted.other.push(...mainItems);
    }
  } else {
    result.pageErrors.push(DATABASE_URL);
    console.warn("Failed to fetch main page. Continuing with known sub-pages.");
  }

  console.log(`Total pages to scrape: ${pagesToScrape.size}`);
  console.log();

  // Scrape each sub-page
  for (const pageUrl of pagesToScrape) {
    const path = new URL(pageUrl).pathname;
    console.log(`Scraping: ${path}`);

    const html = await fetchHtml(pageUrl);
    if (!html) {
      result.pageErrors.push(pageUrl);
      console.warn(`  Skipped (fetch failed)`);
      continue;
    }

    result.pagesScraped++;
    const $ = cheerio.load(html);
    const category = categoryFromPath(path);
    const items = extractItemsFromPage($, pageUrl, category);

    if (items.length > 0) {
      result.extracted[category].push(...items);
      console.log(`  Extracted ${items.length} items -> ${category}`);
    } else {
      console.log(`  No items extracted`);
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
function writeOutput(data: NightfallData): void {
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
