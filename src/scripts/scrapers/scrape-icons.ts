/**
 * scrape-icons.ts
 *
 * Downloads Division 2 item icons from the Fandom Wiki and saves them
 * locally to public/icons/. Uses the MediaWiki API to discover icon images
 * from category pages and infobox templates, with a set of known-good
 * fallback URLs for guaranteed coverage of gear sets and weapon classes.
 *
 * Usage: npx tsx src/scripts/scrapers/scrape-icons.ts
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

// --- Types ---

interface ManifestEntry {
  id: string;
  category: string;
  localPath: string;
  sourceUrl: string;
  source: "fallback" | "wiki";
}

interface IconManifest {
  generatedAt: string;
  totalIcons: number;
  entries: Record<string, ManifestEntry>;
}

interface CategoryResult {
  downloaded: number;
  failed: number;
  skipped: number;
}

// --- Constants ---

const WIKI_API = "https://thedivision.fandom.com/api.php";

// Rate limit delay between API requests (milliseconds)
const RATE_LIMIT_MS = 1500;

// Project root — navigate up from src/scripts/scrapers/ to project root
const PROJECT_ROOT = resolve(
  dirname(new URL(import.meta.url).pathname),
  "../../.."
);
const ICONS_DIR = resolve(PROJECT_ROOT, "public/icons");
const MANIFEST_PATH = resolve(ICONS_DIR, "manifest.json");

// Icon subdirectories to create
const ICON_CATEGORIES = [
  "brands",
  "gear-sets",
  "exotics",
  "talents",
  "weapons",
  "skills",
  "specializations",
] as const;

type IconCategory = (typeof ICON_CATEGORIES)[number];

// Known working fallback URLs — these are downloaded directly without wiki lookup
const FALLBACK_ICONS: Record<string, { category: IconCategory; url: string }> = {
  // Gear Set Icons (13)
  strikers_battlegear: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/a/a0/Striker%27s_Battlegear_icon.png",
  },
  eclipse_protocol: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/9/94/Eclipse_Protocol_icon.png",
  },
  heartbreaker: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/b/b3/Heartbreaker_icon.png",
  },
  hunters_fury: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/c/c5/Hunter%27s_Fury_icon.png",
  },
  foundry_bulwark: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/7/71/Foundry_Bulwark_icon.png",
  },
  future_initiative: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/6/66/Future_Initiative_icon.png",
  },
  negotiators_dilemma: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/d/df/Negotiator%27s_Dilemma_icon.png",
  },
  true_patriot: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/e/e5/True_Patriot_icon.png",
  },
  ongoing_directive: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/d/d4/Ongoing_Directive_icon.png",
  },
  rigger: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/0/0f/Rigger_icon.png",
  },
  tip_of_the_spear: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/3/39/Tip_of_the_Spear_icon.png",
  },
  hard_wired: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/f/f2/Hard_Wired_icon.png",
  },
  aces_and_eights: {
    category: "gear-sets",
    url: "https://static.wikia.nocookie.net/thedivision/images/5/59/Aces_%26_Eights_icon.png",
  },
  // Weapon Class Icons (7)
  assault_rifle: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/3/39/Assault_Rifle_icon.png",
  },
  submachine_gun: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/7/7d/SMG_icon.png",
  },
  light_machine_gun: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/0/0d/LMG_icon.png",
  },
  marksman_rifle: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/f/fa/Marksman_Rifle_icon.png",
  },
  rifle: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/a/a6/Rifle_icon.png",
  },
  shotgun: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/d/d7/Shotgun_icon.png",
  },
  pistol: {
    category: "weapons",
    url: "https://static.wikia.nocookie.net/thedivision/images/4/47/Pistol_icon.png",
  },
};

// Wiki categories to scrape, with alternate names to try if the first is empty
const WIKI_CATEGORIES: {
  iconCategory: IconCategory;
  wikiCategories: string[];
}[] = [
  {
    iconCategory: "brands",
    wikiCategories: [
      "Category:Tom_Clancy's_The_Division_2_Brand_Sets",
      "Category:Brand_Sets",
      "Category:Brand_Sets_(Tom_Clancy's_The_Division_2)",
    ],
  },
  {
    iconCategory: "gear-sets",
    wikiCategories: [
      "Category:Tom_Clancy's_The_Division_2_Gear_Sets",
      "Category:Gear_Sets",
      "Category:Gear_Sets_(Tom_Clancy's_The_Division_2)",
    ],
  },
  {
    iconCategory: "exotics",
    wikiCategories: [
      "Category:Tom_Clancy's_The_Division_2_Exotic_Items",
      "Category:Exotic",
      "Category:Exotic_Items_(Tom_Clancy's_The_Division_2)",
    ],
  },
  {
    iconCategory: "talents",
    wikiCategories: [
      "Category:Tom_Clancy's_The_Division_2_Talents",
      "Category:Talents",
      "Category:Talents_(Tom_Clancy's_The_Division_2)",
    ],
  },
  {
    iconCategory: "skills",
    wikiCategories: [
      "Category:Tom_Clancy's_The_Division_2_Skills",
      "Category:Skills",
      "Category:Skills_(Tom_Clancy's_The_Division_2)",
    ],
  },
  {
    iconCategory: "specializations",
    wikiCategories: [
      "Category:Specializations",
      "Category:Specializations_(Tom_Clancy's_The_Division_2)",
    ],
  },
];

// --- Helpers ---

/** Sleep for the given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Build a MediaWiki API URL with the given query parameters */
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
        "User-Agent": "shd-planner-icon-scraper/1.0 (Division 2 build tool)",
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

/** Convert a page title to a snake_case filename ID */
function toSnakeCase(title: string): string {
  return title
    .replace(/\s*\(.*\)$/, "") // strip parenthetical suffixes
    .replace(/['']/g, "") // strip apostrophes
    .replace(/&/g, "and") // ampersand to "and"
    .replace(/[^a-zA-Z0-9]+/g, "_") // non-alphanumeric to underscore
    .replace(/^_+|_+$/g, "") // trim leading/trailing underscores
    .toLowerCase();
}

/** Download a binary file from a URL and save it to disk */
async function downloadFile(url: string, destPath: string): Promise<boolean> {
  try {
    await sleep(RATE_LIMIT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "shd-planner-icon-scraper/1.0 (Division 2 build tool)",
      },
    });
    if (!res.ok) {
      console.error(`  Download failed (${res.status}): ${url}`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(destPath), { recursive: true });
    writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`  Download error: ${err}`);
    return false;
  }
}

// --- Wiki API Functions ---

/** List all page titles in a wiki category, paginating through results */
async function fetchCategoryMembers(category: string): Promise<string[]> {
  console.log(`  Listing category: ${category}`);
  const members: string[] = [];
  let cmcontinue: string | undefined;

  // Paginate through category members until no more results
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

    // Check for continuation token
    const cont = data.continue as Record<string, string> | undefined;
    cmcontinue = cont?.cmcontinue;
  } while (cmcontinue);

  console.log(`    Found ${members.length} pages`);
  return members;
}

/** Parse a wiki page's wikitext and extract the first icon/image filename from the infobox */
async function extractIconFilename(pageTitle: string): Promise<string | null> {
  console.log(`  Parsing page for icon: ${pageTitle}`);
  const data = await fetchApi({
    action: "parse",
    page: pageTitle,
    prop: "wikitext",
    redirects: "1",
  });

  if (!data || !data.parse) {
    console.error(`    No parse data for: ${pageTitle}`);
    return null;
  }

  const parseData = data.parse as Record<string, unknown>;
  const wikitext = (parseData.wikitext as Record<string, string> | undefined)?.["*"] || "";

  // Try to find [[File:xxx.png]] or [[File:xxx.jpg]] references in infobox context
  // Pattern 1: Infobox image parameter (e.g., |image = Filename.png)
  const infoboxImageMatch = wikitext.match(
    /\|\s*(?:image|icon|logo)\s*=\s*(?:\[\[(?:File|Image):)?([^\n|\]]+\.(?:png|jpg|jpeg|gif|svg))/i
  );
  if (infoboxImageMatch) {
    return infoboxImageMatch[1].trim();
  }

  // Pattern 2: [[File:xxx_icon.png]] anywhere in the page (prefer icon images)
  const fileIconMatch = wikitext.match(
    /\[\[(?:File|Image):([^\]|]+_icon\.(?:png|jpg|jpeg|gif|svg))/i
  );
  if (fileIconMatch) {
    return fileIconMatch[1].trim();
  }

  // Pattern 3: First [[File:xxx.png]] reference on the page
  const fileMatch = wikitext.match(
    /\[\[(?:File|Image):([^\]|]+\.(?:png|jpg|jpeg|gif|svg))/i
  );
  if (fileMatch) {
    return fileMatch[1].trim();
  }

  console.log(`    No icon found in wikitext for: ${pageTitle}`);
  return null;
}

/** Resolve a wiki File: title to its full download URL via imageinfo */
async function resolveImageUrl(filename: string): Promise<string | null> {
  console.log(`  Resolving image URL: File:${filename}`);
  const data = await fetchApi({
    action: "query",
    titles: `File:${filename}`,
    prop: "imageinfo",
    iiprop: "url",
  });

  if (!data || !data.query) return null;

  const query = data.query as Record<string, unknown>;
  const pages = query.pages as Record<string, Record<string, unknown>> | undefined;
  if (!pages) return null;

  // The pages object is keyed by page ID; iterate to find imageinfo
  for (const page of Object.values(pages)) {
    const imageinfo = page.imageinfo as { url: string }[] | undefined;
    if (imageinfo && imageinfo.length > 0) {
      return imageinfo[0].url;
    }
  }

  console.log(`    Could not resolve URL for: ${filename}`);
  return null;
}

// --- Category Processing ---

/**
 * Try multiple wiki category names until one returns results.
 * Returns the list of page titles from the first non-empty category.
 */
async function fetchCategoryWithFallbacks(
  categoryNames: string[]
): Promise<string[]> {
  for (const catName of categoryNames) {
    const members = await fetchCategoryMembers(catName);
    if (members.length > 0) {
      return members;
    }
    console.log(`    Category empty, trying next alternate...`);
  }
  return [];
}

/**
 * Process a single wiki page: extract the icon filename, resolve the URL,
 * download the PNG, and return the manifest entry (or null on failure).
 */
async function processWikiPage(
  pageTitle: string,
  iconCategory: IconCategory,
  existingIds: Set<string>
): Promise<ManifestEntry | null> {
  const id = toSnakeCase(pageTitle);

  // Skip if this ID was already handled by fallback icons
  if (existingIds.has(id)) {
    console.log(`  Skipping ${id} (already have fallback)`);
    return null;
  }

  // Step 1: Parse the page wikitext for an icon filename
  const filename = await extractIconFilename(pageTitle);
  if (!filename) return null;

  // Step 2: Resolve the filename to a download URL
  const imageUrl = await resolveImageUrl(filename);
  if (!imageUrl) return null;

  // Step 3: Download the image
  const localPath = `icons/${iconCategory}/${id}.png`;
  const destPath = resolve(ICONS_DIR, iconCategory, `${id}.png`);

  const success = await downloadFile(imageUrl, destPath);
  if (!success) return null;

  console.log(`  Saved: ${localPath}`);
  return {
    id,
    category: iconCategory,
    localPath,
    sourceUrl: imageUrl,
    source: "wiki",
  };
}

// --- Main ---

async function main(): Promise<void> {
  console.log("=== Division 2 Icon Scraper ===");
  console.log(`Source: ${WIKI_API}`);
  console.log(`Output: ${ICONS_DIR}`);
  console.log();

  // Create all icon subdirectories
  for (const cat of ICON_CATEGORIES) {
    mkdirSync(resolve(ICONS_DIR, cat), { recursive: true });
  }

  const manifest: IconManifest = {
    generatedAt: new Date().toISOString(),
    totalIcons: 0,
    entries: {},
  };

  // Track per-category results for the summary
  const results: Record<string, CategoryResult> = {};
  for (const cat of ICON_CATEGORIES) {
    results[cat] = { downloaded: 0, failed: 0, skipped: 0 };
  }

  // --- Phase 1: Download fallback icons (guaranteed working URLs) ---
  console.log("--- Phase 1: Downloading fallback icons ---");
  console.log();

  for (const [id, { category, url }] of Object.entries(FALLBACK_ICONS)) {
    const localPath = `icons/${category}/${id}.png`;
    const destPath = resolve(ICONS_DIR, category, `${id}.png`);

    // Skip if already downloaded from a previous run
    if (existsSync(destPath)) {
      console.log(`  Skipping (exists): ${localPath}`);
      results[category].skipped++;
      manifest.entries[id] = {
        id,
        category,
        localPath,
        sourceUrl: url,
        source: "fallback",
      };
      continue;
    }

    console.log(`  Downloading fallback: ${id}`);
    const success = await downloadFile(url, destPath);
    if (success) {
      results[category].downloaded++;
      manifest.entries[id] = {
        id,
        category,
        localPath,
        sourceUrl: url,
        source: "fallback",
      };
    } else {
      results[category].failed++;
    }
  }

  console.log();

  // Collect IDs already handled by fallbacks so wiki phase can skip them
  const fallbackIds = new Set(Object.keys(FALLBACK_ICONS));

  // --- Phase 2: Scrape icons from wiki categories ---
  console.log("--- Phase 2: Scraping icons from wiki categories ---");
  console.log();

  for (const { iconCategory, wikiCategories } of WIKI_CATEGORIES) {
    console.log(`Processing category: ${iconCategory}`);

    // Try alternate category names until one returns results
    const pages = await fetchCategoryWithFallbacks(wikiCategories);

    if (pages.length === 0) {
      console.log(`  No pages found for ${iconCategory}, skipping`);
      console.log();
      continue;
    }

    // Process each page in the category
    for (const pageTitle of pages) {
      // Skip sub-category pages
      if (pageTitle.startsWith("Category:")) continue;

      const entry = await processWikiPage(pageTitle, iconCategory, fallbackIds);
      if (entry) {
        manifest.entries[entry.id] = entry;
        results[iconCategory].downloaded++;
      } else {
        // Check if it was skipped (fallback) vs actually failed
        const id = toSnakeCase(pageTitle);
        if (fallbackIds.has(id)) {
          results[iconCategory].skipped++;
        } else {
          results[iconCategory].failed++;
        }
      }
    }

    console.log();
  }

  // --- Write manifest ---
  manifest.totalIcons = Object.keys(manifest.entries).length;
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Manifest saved to: ${MANIFEST_PATH}`);
  console.log();

  // --- Print summary ---
  console.log("=== Summary ===");
  console.log(`Total icons in manifest: ${manifest.totalIcons}`);
  console.log();

  for (const cat of ICON_CATEGORIES) {
    const r = results[cat];
    const total = r.downloaded + r.failed + r.skipped;
    if (total > 0) {
      console.log(
        `  ${cat}: ${r.downloaded} downloaded, ${r.failed} failed, ${r.skipped} skipped`
      );
    }
  }
}

// Run the scraper
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
