// Build Planner page — main layout with gear, weapons, skills, and stats
"use client";

import { useState } from "react";
import { useBuildStore } from "@/hooks/use-build-store";
import { GEAR_SLOTS, WEAPON_SLOTS } from "@/lib/constants";
import type { GearSlot, WeaponSlot } from "@/lib/types";
import {
  GearSlotCard,
  WeaponSlotCard,
  SkillSlotCard,
  SpecSelector,
  StatsPanel,
  GearConfigPanel,
  WeaponConfigPanel,
  SkillConfigPanel,
  ValidationBar,
  BuildLibrary,
} from "@/components/builder";


export default function BuilderPage() {
  // Build state from Zustand
  const currentBuild = useBuildStore((s) => s.currentBuild);
  const isDirty = useBuildStore((s) => s.isDirty);
  const undoStack = useBuildStore((s) => s.undoStack);
  const redoStack = useBuildStore((s) => s.redoStack);
  const setBuildName = useBuildStore((s) => s.setBuildName);
  const saveBuild = useBuildStore((s) => s.saveBuild);
  const clearBuild = useBuildStore((s) => s.clearBuild);
  const setSpecialization = useBuildStore((s) => s.setSpecialization);
  const undo = useBuildStore((s) => s.undo);
  const redo = useBuildStore((s) => s.redo);
  const exportBuild = useBuildStore((s) => s.exportBuild);

  // Panel open state (local UI state)
  const [gearConfigSlot, setGearConfigSlot] = useState<GearSlot | null>(null);
  const [weaponConfigSlot, setWeaponConfigSlot] = useState<WeaponSlot | null>(null);
  const [skillConfigSlot, setSkillConfigSlot] = useState<"skill1" | "skill2" | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  /** Handle build name editing */
  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    const name = e.target.value.trim();
    if (name) setBuildName(name);
    setIsEditingName(false);
  }

  /** Handle Enter key during name editing */
  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  /** Share/export build as JSON to clipboard */
  function handleShare() {
    const build = exportBuild();
    const json = JSON.stringify(build, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert("Build JSON copied to clipboard!");
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-background-secondary px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Build name (editable) */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                defaultValue={currentBuild.name}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                autoFocus
                className="text-xl font-bold text-foreground bg-transparent border-b-2 border-shd-orange focus:outline-none px-1"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-xl font-bold text-foreground hover:text-shd-orange transition-colors cursor-pointer"
                title="Click to rename"
              >
                {currentBuild.name}
              </button>
            )}
            {isDirty && <span className="text-xs text-core-yellow">(unsaved)</span>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Undo */}
            <button
              type="button"
              onClick={undo}
              disabled={undoStack.length === 0}
              className="rounded border border-border bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-foreground-secondary hover:text-foreground text-xs px-3 py-1.5 transition-colors cursor-pointer"
              title="Undo"
            >
              Undo
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={redo}
              disabled={redoStack.length === 0}
              className="rounded border border-border bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed text-foreground-secondary hover:text-foreground text-xs px-3 py-1.5 transition-colors cursor-pointer"
              title="Redo"
            >
              Redo
            </button>

            <div className="w-px h-5 bg-border" />

            {/* Save */}
            <button
              type="button"
              onClick={() => saveBuild(currentBuild.name, currentBuild.description)}
              className="rounded bg-shd-orange hover:bg-shd-orange-hover text-background font-medium text-xs px-3 py-1.5 transition-colors cursor-pointer"
            >
              Save
            </button>

            {/* Load */}
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="rounded border border-border bg-surface hover:bg-surface-hover text-foreground text-xs px-3 py-1.5 transition-colors cursor-pointer"
            >
              Load
            </button>

            {/* Clear */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear all slots? This will reset the current build.")) {
                  clearBuild();
                }
              }}
              className="rounded border border-border bg-surface hover:bg-surface-hover text-foreground-secondary hover:text-core-red text-xs px-3 py-1.5 transition-colors cursor-pointer"
            >
              Clear
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="rounded border border-border bg-surface hover:bg-surface-hover text-foreground text-xs px-3 py-1.5 transition-colors cursor-pointer"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Main content — 3 column layout */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN — Gear Slots */}
          <div className="lg:col-span-4 space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-foreground-secondary font-semibold mb-2">
              Gear Slots
            </h2>
            {GEAR_SLOTS.map((slot) => {
              const piece = currentBuild.gear[slot];
              return (
                <GearSlotCard
                  key={slot}
                  slot={slot}
                  itemName={piece?.itemId}
                  source={piece?.source}
                  coreType={piece?.coreAttribute?.type}
                  onClick={() => setGearConfigSlot(slot)}
                />
              );
            })}
          </div>

          {/* CENTER COLUMN — Weapons + Skills + Specialization */}
          <div className="lg:col-span-4 space-y-4">
            {/* Weapons */}
            <div className="space-y-2">
              <h2 className="text-xs uppercase tracking-wider text-foreground-secondary font-semibold mb-2">
                Weapons
              </h2>
              {WEAPON_SLOTS.map((slot) => {
                const weapon = currentBuild.weapons[slot];
                return (
                  <WeaponSlotCard
                    key={slot}
                    slot={slot}
                    weaponName={weapon?.weaponId}
                    talentName={weapon?.talent?.talentId}
                    onClick={() => setWeaponConfigSlot(slot)}
                  />
                );
              })}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h2 className="text-xs uppercase tracking-wider text-foreground-secondary font-semibold mb-2">
                Skills
              </h2>
              <SkillSlotCard
                slot="skill1"
                skillName={currentBuild.skills.skill1?.skillVariantId}
                onClick={() => setSkillConfigSlot("skill1")}
              />
              <SkillSlotCard
                slot="skill2"
                skillName={currentBuild.skills.skill2?.skillVariantId}
                onClick={() => setSkillConfigSlot("skill2")}
              />
            </div>

            {/* Specialization */}
            <SpecSelector
              selected={currentBuild.specialization}
              onChange={setSpecialization}
            />
          </div>

          {/* RIGHT COLUMN — Stats Panel */}
          <div className="lg:col-span-4">
            <StatsPanel />
          </div>
        </div>

        {/* BOTTOM — Validation Bar */}
        <div className="mt-4">
          <ValidationBar />
        </div>
      </div>

      {/* Config panels (slide-out modals) */}
      {gearConfigSlot && (
        <GearConfigPanel
          isOpen={!!gearConfigSlot}
          slot={gearConfigSlot}
          onClose={() => setGearConfigSlot(null)}
        />
      )}

      {weaponConfigSlot && (
        <WeaponConfigPanel
          isOpen={!!weaponConfigSlot}
          slot={weaponConfigSlot}
          onClose={() => setWeaponConfigSlot(null)}
        />
      )}

      {skillConfigSlot && (
        <SkillConfigPanel
          isOpen={!!skillConfigSlot}
          slot={skillConfigSlot}
          onClose={() => setSkillConfigSlot(null)}
        />
      )}

      {/* Build Library (slide-out panel) */}
      <BuildLibrary isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
    </div>
  );
}
