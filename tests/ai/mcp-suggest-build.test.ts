import { afterEach, describe, expect, it, vi } from "vitest";

import { execFile } from "child_process";
import { suggestBuildWithMcp } from "@/lib/ai/mcp-suggest-build";

vi.mock("child_process", () => ({
  execFile: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("suggestBuildWithMcp", () => {
  it("returns parsed suggestions from python bridge", async () => {
    vi.mocked(execFile).mockImplementation(((_cmd, _args, _opts, cb) => {
      cb?.(
        null,
        JSON.stringify({
          suggestions: [{ id: "test-build", tier: "S" }],
          message: "ok",
        }),
        ""
      );
      return {} as never;
    }) as never);

    const result = await suggestBuildWithMcp({
      role: "dps",
      mode: "legendary",
      constraints: ["striker"],
    });

    expect(result.success).toBe(true);
    expect(result.available).toBe(true);
    expect(result.role).toBe("dps");
    expect(result.mode).toBe("legendary");
    expect(result.suggestions).toHaveLength(1);
  });

  it("returns timeout error when python command exceeds timeout", async () => {
    vi.mocked(execFile).mockImplementation(((_cmd, _args, _opts, cb) => {
      cb?.(
        {
          message: "Command failed: timed out",
          signal: "SIGTERM",
        } as NodeJS.ErrnoException,
        "",
        "timed out"
      );
      return {} as never;
    }) as never);

    const result = await suggestBuildWithMcp({ role: "dps", mode: "general" });

    expect(result.success).toBe(false);
    expect(result.available).toBe(false);
    expect(result.error?.code).toBe("TIMEOUT");
  });

  it("returns execution failure for non-zero python exit", async () => {
    vi.mocked(execFile).mockImplementation(((_cmd, _args, _opts, cb) => {
      cb?.(
        {
          message: "Command failed",
          code: 1,
        } as NodeJS.ErrnoException,
        "",
        "import error"
      );
      return {} as never;
    }) as never);

    const result = await suggestBuildWithMcp({
      build: {
        name: "DZ setup",
        description: "PVP build",
        gear: {},
      },
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("EXECUTION_FAILED");
    expect(result.mode).toBe("pvp");
  });
});
