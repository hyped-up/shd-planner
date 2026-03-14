#!/usr/bin/env python3
"""Bridge script for invoking build suggestions from shd-planner MCP Python code."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def _load_payload() -> dict:
    if len(sys.argv) < 2:
        raise ValueError("Expected one JSON argument")
    raw = sys.argv[1]
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("Payload must be a JSON object")
    return data


def _import_suggest_tool(service_dir: Path):
    sys.path.insert(0, str(service_dir))

    try:
        from server import div2_suggest_build  # type: ignore

        return div2_suggest_build
    except Exception as server_error:
        try:
            from tools.build_analyzer import suggest_build  # type: ignore

            def _fallback(role: str, mode: str, constraints: list[str] | None = None) -> dict:
                results = suggest_build(role, mode, constraints)
                if not results:
                    return {
                        "message": (
                            f"No pre-built suggestions for role='{role}' "
                            f"mode='{mode}'. Try broader terms."
                        )
                    }
                return {"suggestions": results}

            return _fallback
        except Exception as fallback_error:
            raise RuntimeError(
                "Failed to import suggestion tools "
                f"(server import: {server_error}; fallback import: {fallback_error})"
            ) from fallback_error


def main() -> int:
    payload = _load_payload()

    role = str(payload.get("role") or "dps").strip().lower()
    mode = str(payload.get("mode") or "general").strip().lower()
    constraints_raw = payload.get("constraints")
    constraints = constraints_raw if isinstance(constraints_raw, list) else None

    repo_root = Path(__file__).resolve().parents[3]
    service_dir = repo_root / "services" / "shd-planner-mcp"
    if not service_dir.exists():
        raise FileNotFoundError(f"MCP service directory not found: {service_dir}")

    suggest_tool = _import_suggest_tool(service_dir)
    result = suggest_tool(role, mode, constraints)

    print(json.dumps(result, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
