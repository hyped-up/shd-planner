/**
 * Sharing module — build sharing, URL encoding, and JSON import/export.
 */

// URL codec for compressed build sharing links
export { encodeBuild, decodeBuild } from "./url-codec";

// Build migration for cross-version compatibility
export { migrateBuild } from "./build-migrator";

// JSON import/export for file-based sharing
export { exportBuildAsJSON, importBuildFromJSON } from "./json-export";

// Sharing-specific types
export type { IMigrationResult, IImportResult, ICompactBuild } from "./types";
