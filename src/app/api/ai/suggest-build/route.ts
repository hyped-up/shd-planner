import { NextResponse } from "next/server";

import { suggestBuildWithMcp } from "@/lib/ai/mcp-suggest-build";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        available: false,
        suggestions: [],
        error: {
          code: "INVALID_INPUT",
          message: "Request body must be valid JSON",
        },
      },
      { status: 400 }
    );
  }

  const response = await suggestBuildWithMcp(body as Parameters<typeof suggestBuildWithMcp>[0]);

  if (response.error?.code === "INVALID_INPUT") {
    return NextResponse.json(response, { status: 400 });
  }

  return NextResponse.json(response);
}
