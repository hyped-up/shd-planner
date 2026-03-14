// Gear configuration panel — slide-out modal for configuring a gear piece
"use client";

import { useState, useEffect, useCallback } from "react";
import type { GearSlot, CoreAttributeType, IBuildGearPiece } from "@/lib/types";
import { composeGearSlotOptions, type GearPickerOption, type GearSource } from "@/lib/gear-slot-picker";
import { useBuildStore } from "@/hooks/use-build-store";
import SearchableSelect from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import {
  getAllBrands,
  getAllGearSets,
  getAllNamedItems,
  getAllExoticGear,
  getGearTalentsBySlot,
  getAllMinorAttributes,
} from "@/lib/data-loader";
import type { IGearAttribute } from "@/lib/types";

interface GearConfigPanelProps {
  isOpen: boolean;
  slot: GearSlot;
  onClose: () => void;
}

// Core attribute options
const CORE_OPTIONS: { key: CoreAttributeType; label: string }[] = [
  { key: "weaponDamage", label: "Weapon Damage" },
  { key: "armor", label: "Armor" },
  { key: "skillTier", label: "Skill Tier" },
];

// Core attribute max values
const CORE_MAX_VALUES: Record<CoreAttributeType, number> = {
  weaponDamage: 15,
  armor: 170370,
  skillTier: 1,
};


/**
 * Inner component that initializes state from the current gear piece.
 * Parent conditionally renders this so it remounts (and re-initializes state)
 * each time the panel opens with a new slot.
 */
function GearConfigPanelInner({ slot, onClose }: { slot: GearSlot; onClose: () => void }) {
  const setGearPiece = useBuildStore((s) => s.setGearPiece);
  const currentGear = useBuildStore((s) => s.currentBuild.gear[slot]);

  // Local configuration state — initialized from store on mount
  const [source, setSource] = useState<GearSource>(currentGear?.source ?? "brand");
  const [itemId, setItemId] = useState(currentGear?.itemId ?? "");
  const [coreType, setCoreType] = useState<CoreAttributeType>(currentGear?.coreAttribute?.type ?? "weaponDamage");
  const [coreValue, setCoreValue] = useState(currentGear?.coreAttribute?.value ?? 15);
  const [minorAttrs, setMinorAttrs] = useState<Array<{ attributeId: string; value: number }>>(
    currentGear?.minorAttributes ?? []
  );
  const [modSlot, setModSlot] = useState<{ modId: string; value: number } | null>(currentGear?.modSlot ?? null);
  const [talentId, setTalentId] = useState(currentGear?.talent?.talentId ?? "");

  // Talent slot eligibility (only Chest and Backpack)
  const hasTalentSlot = slot === "Chest" || slot === "Backpack";

  const [itemOptions, setItemOptions] = useState<GearPickerOption[]>([]);
  const [talentOptions, setTalentOptions] = useState<SearchableSelectOption[]>([]);
  const [minorAttributeData, setMinorAttributeData] = useState<IGearAttribute[]>([]);

  // Load unified item options for this slot
  useEffect(() => {
    async function loadItems() {
      const [brands, sets, namedItems, exotics] = await Promise.all([
        getAllBrands(),
        getAllGearSets(),
        getAllNamedItems(),
        getAllExoticGear(),
      ]);

      const options = composeGearSlotOptions(slot, brands, sets, namedItems, exotics);
      setItemOptions(options);

      // Keep source in sync when selected item exists in the slot list.
      if (itemId) {
        const selected = options.find((option) => option.id === itemId);
        if (selected && selected.source !== source) {
          setSource(selected.source);
        }
      }
    }
    loadItems();
  }, [slot, itemId, source]);

  // Load talent options (chest/backpack only)
  useEffect(() => {
    if (!hasTalentSlot) return;
    async function loadTalents() {
      const talentSlot = slot.toLowerCase() as "chest" | "backpack";
      const talents = await getGearTalentsBySlot(talentSlot);
      setTalentOptions(
        talents.map((t) => ({
          id: t.id,
          name: t.name,
          subtitle: t.description.slice(0, 60) + (t.description.length > 60 ? "..." : ""),
        }))
      );
    }
    loadTalents();
  }, [slot, hasTalentSlot]);

  // Load minor attributes from data
  useEffect(() => {
    async function loadAttrs() {
      const attrs = await getAllMinorAttributes();
      setMinorAttributeData(attrs);
    }
    loadAttrs();
  }, []);

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

  /** Apply the configured gear piece to the build */
  function handleApply() {
    if (!itemId.trim()) return;

    const piece: IBuildGearPiece = {
      slotId: slot,
      source,
      itemId: itemId.trim(),
      coreAttribute: { type: coreType, value: coreValue },
      minorAttributes: minorAttrs,
      modSlot,
      talent: talentId ? { talentId } : null,
    };
    setGearPiece(slot, piece);
    onClose();
  }

  /** Add a minor attribute row */
  function addMinorAttr() {
    if (minorAttrs.length >= 2) return;
    setMinorAttrs([...minorAttrs, { attributeId: "", value: 0 }]);
  }

  /** Remove a minor attribute row */
  function removeMinorAttr(index: number) {
    setMinorAttrs(minorAttrs.filter((_, i) => i !== index));
  }

  /** Update a minor attribute */
  function updateMinorAttr(index: number, field: "attributeId" | "value", val: string | number) {
    setMinorAttrs(
      minorAttrs.map((attr, i) => (i === index ? { ...attr, [field]: val } : attr))
    );
  }

  // Find the max value for the selected minor attribute
  function getMinorMax(attrId: string): number {
    return minorAttributeData.find((a) => a.id === attrId)?.maxRoll ?? 100;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background-secondary border-l border-border z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-foreground">Configure {slot}</h2>
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
          {/* Step 1: Item selection */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 1: Select Item</div>
            <SearchableSelect
              options={itemOptions}
              value={itemId}
              onChange={(id) => {
                setItemId(id);
                const selected = itemOptions.find((option) => option.id === id);
                if (selected) {
                  setSource(selected.source);
                }
              }}
              placeholder="Search all valid items..."
            />
          </div>

          {/* Step 2: Core attribute */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Step 3: Core Attribute</div>
            <div className="space-y-2">
              {/* Core type selector */}
              <div className="grid grid-cols-3 gap-1">
                {CORE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setCoreType(opt.key);
                      setCoreValue(CORE_MAX_VALUES[opt.key]);
                    }}
                    className={`text-xs font-medium px-2 py-2 rounded transition-colors cursor-pointer ${
                      coreType === opt.key
                        ? `bg-surface border-2 ${opt.key === "weaponDamage" ? "border-core-red text-core-red" : opt.key === "armor" ? "border-core-blue text-core-blue" : "border-core-yellow text-core-yellow"}`
                        : "bg-surface text-foreground-secondary hover:bg-surface-hover border-2 border-transparent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Core value slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={CORE_MAX_VALUES[coreType]}
                  step={coreType === "skillTier" ? 1 : coreType === "weaponDamage" ? 0.5 : 1000}
                  value={coreValue}
                  onChange={(e) => setCoreValue(Number(e.target.value))}
                  className="flex-1 accent-shd-orange"
                />
                <span className="text-sm text-foreground font-medium w-20 text-right">
                  {coreType === "weaponDamage"
                    ? `${coreValue.toFixed(1)}%`
                    : coreType === "skillTier"
                      ? coreValue.toFixed(0)
                      : coreValue.toLocaleString()}
                </span>
              </div>

              {/* God roll indicator */}
              <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    coreValue >= CORE_MAX_VALUES[coreType] ? "bg-core-yellow" : "bg-shd-orange"
                  }`}
                  style={{ width: `${(coreValue / CORE_MAX_VALUES[coreType]) * 100}%` }}
                />
              </div>
              {coreValue >= CORE_MAX_VALUES[coreType] && (
                <span className="text-xs text-core-yellow font-medium">God Roll</span>
              )}
            </div>
          </div>

          {/* Minor Attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-foreground-secondary">Minor Attributes</div>
              {minorAttrs.length < 2 && (
                <button
                  type="button"
                  onClick={addMinorAttr}
                  className="text-xs text-shd-orange hover:text-shd-orange-hover transition-colors cursor-pointer"
                >
                  + Add
                </button>
              )}
            </div>

            {minorAttrs.length === 0 && (
              <p className="text-xs text-foreground-secondary italic">No minor attributes configured</p>
            )}

            {minorAttrs.map((attr, index) => {
              const maxVal = getMinorMax(attr.attributeId);
              const attrDef = minorAttributeData.find((a) => a.id === attr.attributeId);
              return (
                <div key={index} className="space-y-2 mb-3 p-2 rounded bg-surface border border-border">
                  <div className="flex items-center gap-2">
                    <select
                      value={attr.attributeId}
                      onChange={(e) => {
                        updateMinorAttr(index, "attributeId", e.target.value);
                        // Reset value to max of new attribute
                        const newMax = getMinorMax(e.target.value);
                        updateMinorAttr(index, "value", newMax);
                      }}
                      className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-xs px-2 py-1.5 focus:outline-none focus:border-shd-orange cursor-pointer"
                    >
                      <option value="">Select attribute...</option>
                      {minorAttributeData.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMinorAttr(index)}
                      className="text-core-red hover:text-danger text-xs cursor-pointer p-1"
                    >
                      Remove
                    </button>
                  </div>

                  {attr.attributeId && (
                    <>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={maxVal}
                          step={maxVal > 100 ? 100 : 0.5}
                          value={attr.value}
                          onChange={(e) => updateMinorAttr(index, "value", Number(e.target.value))}
                          className="flex-1 accent-shd-orange"
                        />
                        <span className="text-xs text-foreground font-medium w-16 text-right">
                          {attrDef?.unit === "percent"
                            ? `${attr.value.toFixed(1)}%`
                            : attr.value.toLocaleString()}
                        </span>
                      </div>
                      {/* God roll bar */}
                      <div className="h-1 rounded-full bg-background-tertiary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            attr.value >= maxVal ? "bg-core-yellow" : "bg-shd-orange"
                          }`}
                          style={{ width: `${(attr.value / maxVal) * 100}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mod Slot */}
          <div>
            <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Mod Slot</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={modSlot?.modId ?? ""}
                onChange={(e) =>
                  setModSlot(e.target.value ? { modId: e.target.value, value: modSlot?.value ?? 0 } : null)
                }
                placeholder="Enter mod name (optional)..."
                className="flex-1 rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
              />
            </div>
          </div>

          {/* Talent (Chest/Backpack only) */}
          {hasTalentSlot && (
            <div>
              <div className="text-xs uppercase tracking-wider text-foreground-secondary mb-2">Talent</div>
              <SearchableSelect
                options={talentOptions}
                value={talentId}
                onChange={(id) => setTalentId(id)}
                placeholder="Search talents..."
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 p-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleApply}
            disabled={!itemId.trim()}
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
export default function GearConfigPanel({ isOpen, slot, onClose }: GearConfigPanelProps) {
  if (!isOpen) return null;
  return <GearConfigPanelInner key={`${slot}`} slot={slot} onClose={onClose} />;
}
