// Validation bar — collapsible bar showing build errors and warnings
"use client";

import { useState } from "react";
import { useBuildStore } from "@/hooks/use-build-store";

export default function ValidationBar() {
  const errors = useBuildStore((s) => s.validationErrors);
  const [isExpanded, setIsExpanded] = useState(false);

  // Count by severity
  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  // Nothing to show
  if (errors.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-success font-medium">Build is valid</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface">
      {/* Summary header — click to expand */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {errorCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-core-red" />
              <span className="text-xs text-core-red font-medium">
                {errorCount} error{errorCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-core-yellow" />
              <span className="text-xs text-core-yellow font-medium">
                {warningCount} warning{warningCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Expand/collapse chevron */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-foreground-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded error list */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-2 space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 py-1">
              <div
                className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                  error.severity === "error" ? "bg-core-red" : "bg-core-yellow"
                }`}
              />
              <div>
                <span
                  className={`text-xs font-medium ${
                    error.severity === "error" ? "text-core-red" : "text-core-yellow"
                  }`}
                >
                  {error.field}:
                </span>{" "}
                <span className="text-xs text-foreground-secondary">{error.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
