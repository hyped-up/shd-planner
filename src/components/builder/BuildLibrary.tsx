// Build library — slide-out panel for managing saved builds
"use client";

import { useState, useEffect, useCallback } from "react";
import { useBuildStore } from "@/hooks/use-build-store";

interface BuildLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuildLibrary({ isOpen, onClose }: BuildLibraryProps) {
  const savedBuilds = useBuildStore((s) => s.savedBuilds);
  const loadBuild = useBuildStore((s) => s.loadBuild);
  const deleteBuild = useBuildStore((s) => s.deleteBuild);
  const duplicateBuild = useBuildStore((s) => s.duplicateBuild);
  const clearBuild = useBuildStore((s) => s.clearBuild);
  const [searchFilter, setSearchFilter] = useState("");

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Filter builds by search query
  const filtered = savedBuilds.filter(
    (b) =>
      b.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  /** Count equipped gear pieces for a quick summary */
  function gearCount(build: { gear: Record<string, unknown> }): number {
    return Object.keys(build.gear).length;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background-secondary border-l border-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Saved Builds</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors p-1 cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search + New Build */}
        <div className="p-4 space-y-3 border-b border-border">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search builds..."
            className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              clearBuild();
              onClose();
            }}
            className="w-full rounded bg-shd-orange hover:bg-shd-orange-hover text-background font-medium text-sm px-4 py-2 transition-colors cursor-pointer"
          >
            + New Build
          </button>
        </div>

        {/* Build list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center text-foreground-secondary text-sm py-8">
              {savedBuilds.length === 0 ? "No saved builds yet" : "No builds match your search"}
            </div>
          )}

          {filtered.map((build) => (
            <div
              key={build.id}
              className="rounded-md border border-border bg-surface p-3 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{build.name}</div>
                  {build.description && (
                    <div className="text-xs text-foreground-secondary mt-0.5 truncate">{build.description}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground-secondary">
                    <span>{gearCount(build)}/6 gear</span>
                    <span>{build.specialization ?? "No spec"}</span>
                    <span>{new Date(build.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    loadBuild(build.id);
                    onClose();
                  }}
                  className="text-xs text-shd-orange hover:text-shd-orange-hover transition-colors cursor-pointer font-medium"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => duplicateBuild(build.id)}
                  className="text-xs text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete "${build.name}"?`)) {
                      deleteBuild(build.id);
                    }
                  }}
                  className="text-xs text-core-red hover:text-danger transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
