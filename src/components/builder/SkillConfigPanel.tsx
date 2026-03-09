// Skill configuration panel — slide-out modal for configuring a skill slot
"use client";

import { useState, useEffect, useCallback } from "react";
import type { IBuildSkill, SkillCategory } from "@/lib/types";
import { SKILL_CATEGORIES } from "@/lib/constants";
import { useBuildStore } from "@/hooks/use-build-store";
import SearchableSelect from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import { getAllSkills } from "@/lib/data-loader";

interface SkillConfigPanelProps {
  isOpen: boolean;
  slot: "skill1" | "skill2";
  onClose: () => void;
}

// Readable slot labels
const SLOT_LABELS: Record<string, string> = {
  skill1: "Skill 1",
  skill2: "Skill 2",
};

/**
 * Inner component — remounts each time the panel opens to reset state.
 */
function SkillConfigPanelInner({ slot, onClose }: { slot: "skill1" | "skill2"; onClose: () => void }) {
  const setSkill = useBuildStore((s) => s.setSkill);
  const currentSkill = useBuildStore((s) => s.currentBuild.skills[slot]);
  const skillTier = useBuildStore((s) => s.computedStats.totalSkillTier);

  // Local state — initialized from store on mount
  const [category, setCategory] = useState<SkillCategory | "">(
    ""
  );
  const [variantId, setVariantId] = useState(currentSkill?.skillVariantId ?? "");
  const [mods, setMods] = useState<string[]>(currentSkill?.mods ?? []);
  const [variantOptions, setVariantOptions] = useState<SearchableSelectOption[]>([]);

  useEffect(() => {
    if (!category) return;
    async function loadVariants() {
      const skills = await getAllSkills();
      const skill = skills.find((s) => s.name === category);
      if (!skill) {
        setVariantOptions([]);
        return;
      }
      setVariantOptions(
        skill.variants.map((v) => ({
          id: v.id,
          name: v.name,
          subtitle: v.description.slice(0, 60) + (v.description.length > 60 ? "..." : ""),
        }))
      );
    }
    loadVariants();
  }, [category]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  /** Apply skill configuration */
  function handleApply() {
    if (!variantId.trim()) return;

    const skill: IBuildSkill = {
      slotId: slot,
      skillVariantId: variantId.trim(),
      mods: mods.filter((m) => m.trim()),
    };
    setSkill(slot, skill);
    onClose();
  }

  /** Add a skill mod slot */
  function addMod() {
    if (mods.length >= 3) return;
    setMods([...mods, ""]);
  }

  /** Remove a skill mod */
  function removeMod(index: number) {
    setMods(mods.filter((_, i) => i !== index));
  }

  /** Update a skill mod */
  function updateMod(index: number, value: string) {
    setMods(mods.map((m, i) => (i === index ? value : m)));
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background-secondary border-l border-border z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-foreground">Configure {SLOT_LABELS[slot]}</h2>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Current Skill Tier indicator */}
          <div className="rounded-md bg-surface border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-secondary">Current Skill Tier</span>
              <span className="text-sm font-bold text-core-yellow">{skillTier}</span>
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Skill effectiveness scales with your equipped Skill Tier level.
            </p>
          </div>

          {/* Step 1: Skill Category */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 1: Skill Category</div>
            <div className="grid grid-cols-3 gap-1">
              {SKILL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-medium px-2 py-2 rounded transition-colors cursor-pointer ${
                    category === cat
                      ? "bg-shd-orange text-background"
                      : "bg-surface text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Variant Selection */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 2: Choose Variant</div>
            <SearchableSelect
              options={variantOptions}
              value={variantId}
              onChange={(id) => setVariantId(id)}
              placeholder={category ? `Search ${category} variants...` : "Select a category first..."}
              disabled={!category}
            />
          </div>

          {/* Skill Mods */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-foreground-secondary">Skill Mods</div>
              {mods.length < 3 && (
                <button
                  type="button"
                  onClick={addMod}
                  className="text-xs text-shd-orange hover:text-shd-orange-hover transition-colors cursor-pointer"
                >
                  + Add Mod
                </button>
              )}
            </div>

            {mods.length === 0 && (
              <p className="text-xs text-foreground-secondary italic">No skill mods configured</p>
            )}

            {mods.map((mod, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={mod}
                  onChange={(e) => updateMod(index, e.target.value)}
                  placeholder={`Skill mod ${index + 1}...`}
                  className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-xs px-2 py-1.5 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeMod(index)}
                  className="text-core-red hover:text-danger text-xs cursor-pointer p-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 p-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleApply}
            disabled={!variantId.trim()}
            className="flex-1 rounded bg-shd-orange hover:bg-shd-orange-hover disabled:opacity-40 disabled:cursor-not-allowed text-background font-medium text-sm px-4 py-2.5 transition-colors cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-border bg-surface hover:bg-surface-hover text-foreground text-sm px-4 py-2.5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

/** Wrapper that conditionally renders the inner panel (remounts to reset state) */
export default function SkillConfigPanel({ isOpen, slot, onClose }: SkillConfigPanelProps) {
  if (!isOpen) return null;
  return <SkillConfigPanelInner key={slot} slot={slot} onClose={onClose} />;
}
