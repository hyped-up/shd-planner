import { execFile } from "child_process";
import path from "path";

import type { IBuild } from "@/lib/types";

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_SUGGEST_TIMEOUT_MS ?? 8000);
const DEFAULT_MAX_CONSTRAINTS = 4;

type SuggestionRecord = Record<string, unknown>;

export interface SuggestBuildError {
  code: "INVALID_INPUT" | "TIMEOUT" | "UNAVAILABLE" | "EXECUTION_FAILED" | "INVALID_RESPONSE";
  message: string;
  details?: string;
}

export interface SuggestBuildResponse {
  success: boolean;
  available: boolean;
  role: string;
  mode: string;
  constraints: string[];
  suggestions: SuggestionRecord[];
  message?: string;
  error?: SuggestBuildError;
}

export interface SuggestBuildRequest {
  build?: Partial<IBuild> | null;
  role?: string;
  mode?: string;
  constraints?: string[];
}

function inferRole(build?: Partial<IBuild> | null): string {
  if (!build?.gear) return "dps";

  let weaponCores = 0;
  let armorCores = 0;
  let skillCores = 0;

  for (const piece of Object.values(build.gear)) {
    const core = piece?.coreAttribute?.type;
    if (core === "weaponDamage") weaponCores += 1;
    if (core === "armor") armorCores += 1;
    if (core === "skillTier") skillCores += 1;
  }

  const skillNames = Object.values(build.skills ?? {})
    .map((skill) => skill?.skillVariantId?.toLowerCase() ?? "")
    .join(" ");

  if (skillNames.includes("restorer") || skillNames.includes("healer") || skillNames.includes("chem_launcher_reinforcer")) {
    return "healer";
  }
  if (skillCores >= 4) return "skill";
  if (armorCores >= 4) return "tank";
  if (weaponCores >= 4) return "dps";
  return "hybrid";
}

function inferMode(build?: Partial<IBuild> | null): string {
  const text = `${build?.name ?? ""} ${build?.description ?? ""}`.toLowerCase();
  if (text.includes("legendary")) return "legendary";
  if (text.includes("raid")) return "raid";
  if (text.includes("countdown")) return "countdown";
  if (text.includes("descent")) return "descent";
  if (text.includes("pvp") || text.includes("conflict") || text.includes("dark zone") || text.includes("dz")) {
    return "pvp";
  }
  return "general";
}

function inferConstraints(build?: Partial<IBuild> | null, limit = DEFAULT_MAX_CONSTRAINTS): string[] {
  const gearIds = Object.values(build?.gear ?? {})
    .map((piece) => piece?.itemId)
    .filter((id): id is string => !!id);

  const weaponIds = Object.values(build?.weapons ?? {})
    .map((weapon) => weapon?.weaponId)
    .filter((id): id is string => !!id);

  const skillIds = Object.values(build?.skills ?? {})
    .map((skill) => skill?.skillVariantId)
    .filter((id): id is string => !!id);

  return [...new Set([...gearIds, ...weaponIds, ...skillIds])].slice(0, limit);
}

function normalizeToolOutput(
  output: unknown,
  role: string,
  mode: string,
  constraints: string[]
): SuggestBuildResponse {
  if (!output || typeof output !== "object") {
    return {
      success: false,
      available: false,
      role,
      mode,
      constraints,
      suggestions: [],
      error: {
        code: "INVALID_RESPONSE",
        message: "Python MCP bridge returned an invalid response",
      },
    };
  }

  const result = output as { suggestions?: unknown; message?: unknown };
  const suggestions = Array.isArray(result.suggestions)
    ? result.suggestions.filter((item): item is SuggestionRecord => !!item && typeof item === "object")
    : [];

  return {
    success: true,
    available: true,
    role,
    mode,
    constraints,
    suggestions,
    message: typeof result.message === "string" ? result.message : undefined,
  };
}

export async function suggestBuildWithMcp(request: SuggestBuildRequest): Promise<SuggestBuildResponse> {
  if (!request || typeof request !== "object") {
    return {
      success: false,
      available: false,
      role: "dps",
      mode: "general",
      constraints: [],
      suggestions: [],
      error: {
        code: "INVALID_INPUT",
        message: "Request body must be an object",
      },
    };
  }

  const role = (request.role ?? inferRole(request.build)).trim().toLowerCase() || "dps";
  const mode = (request.mode ?? inferMode(request.build)).trim().toLowerCase() || "general";
  const constraints = Array.isArray(request.constraints)
    ? request.constraints.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : inferConstraints(request.build);

  const scriptPath = path.resolve(process.cwd(), "src/scripts/ai/mcp_suggest_build.py");
  const payload = JSON.stringify({ role, mode, constraints });

  return new Promise((resolve) => {
    execFile(
      "python3",
      [scriptPath, payload],
      {
        cwd: process.cwd(),
        timeout: DEFAULT_TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          const err = error as NodeJS.ErrnoException & { code?: number | string | null; signal?: NodeJS.Signals | null };
          const timedOut = err.signal === "SIGTERM" && /timed out/i.test(err.message);
          const unavailable = err.code === "ENOENT";

          resolve({
            success: false,
            available: false,
            role,
            mode,
            constraints,
            suggestions: [],
            error: {
              code: unavailable ? "UNAVAILABLE" : timedOut ? "TIMEOUT" : "EXECUTION_FAILED",
              message: unavailable
                ? "Python runtime is unavailable"
                : timedOut
                  ? "Timed out while requesting build suggestions"
                  : "Failed to run MCP suggestion bridge",
              details: stderr?.trim() || err.message,
            },
          });
          return;
        }

        try {
          const parsed = JSON.parse(stdout);
          resolve(normalizeToolOutput(parsed, role, mode, constraints));
        } catch {
          resolve({
            success: false,
            available: false,
            role,
            mode,
            constraints,
            suggestions: [],
            error: {
              code: "INVALID_RESPONSE",
              message: "MCP bridge returned non-JSON output",
              details: (stderr?.trim() || stdout?.trim() || "No output").slice(0, 500),
            },
          });
        }
      }
    );
  });
}
