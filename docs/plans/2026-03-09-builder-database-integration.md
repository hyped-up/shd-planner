# Builder Database Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hardcoded constants and free-text inputs in the builder config panels with data-driven searchable dropdowns powered by the data-loader.

**Architecture:** Fix enums/constants to match actual JSON data, add a `getAllMinorAttributes()` function to data-loader, build a shared `SearchableSelect` combobox component, then wire all 5 config panel fields to load items from the data-loader.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Zustand, existing data-loader (async `import()` from `@/data/*.json`)

---

### Task 1: Fix enums and constants to match data

**Files:**
- Modify: `src/lib/types/enums.ts`
- Modify: `src/lib/constants.ts`

**Step 1: Update `src/lib/types/enums.ts`**

Replace `WeaponType` with data-matching values:

```typescript
export type WeaponType =
  | "Assault Rifles"
  | "Submachine Guns"
  | "Light Machine Guns"
  | "Rifles"
  | "Marksman Rifles"
  | "Shotguns"
  | "Pistols";
```

Replace `SkillCategory` with all 12 skill types from data:

```typescript
export type SkillCategory =
  | "Ballistic Shield"
  | "Chem Launcher"
  | "Decoy"
  | "Drone"
  | "Firefly"
  | "Hive"
  | "Pulse"
  | "Seeker Mine"
  | "Smart Cover"
  | "Sticky Bomb"
  | "Trap"
  | "Turret";
```

**Step 2: Update `src/lib/constants.ts`**

Replace `WEAPON_TYPES`:

```typescript
export const WEAPON_TYPES = [
  "Assault Rifles",
  "Submachine Guns",
  "Light Machine Guns",
  "Rifles",
  "Marksman Rifles",
  "Shotguns",
  "Pistols",
] as const;
```

Replace `SKILL_CATEGORIES`:

```typescript
export const SKILL_CATEGORIES = [
  "Ballistic Shield",
  "Chem Launcher",
  "Decoy",
  "Drone",
  "Firefly",
  "Hive",
  "Pulse",
  "Seeker Mine",
  "Smart Cover",
  "Sticky Bomb",
  "Trap",
  "Turret",
] as const;
```

**Step 3: Fix any compile errors from the type change**

Grep for old values (`"Assault Rifle"`, `"LMG"`, `"SMG"`, `"Shield"`) across `src/` and update to match. Key files:
- `src/lib/data-loader.ts` line 291: `"Assault Rifle"` default → `"Assault Rifles"`
- `src/components/builder/WeaponConfigPanel.tsx`: uses `WEAPON_TYPES` (auto-fixed)
- `src/components/builder/SkillConfigPanel.tsx`: uses `SKILL_CATEGORIES` (auto-fixed)

**Step 4: Verify build compiles**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 5: Commit**

```
fix: sync enums and constants with actual game data

Adds 3 missing skill categories (Sticky Bomb, Decoy, Smart Cover),
fixes Shield→Ballistic Shield, and updates weapon type names to match
the canonical data files (Assault Rifles, Submachine Guns, etc.).
```

---

### Task 2: Add `getAllMinorAttributes()` to data-loader

**Files:**
- Modify: `src/lib/data-loader.ts`

**Step 1: Add the function after the existing `getAttributeMaxValue` function**

```typescript
/** Get all minor attributes (excludes core attributes) */
export async function getAllMinorAttributes(): Promise<IGearAttribute[]> {
  const data = await import("@/data/gear-attributes.json");
  return (data.default as RawJson[])
    .filter((a) => a.category?.startsWith("minor_"))
    .map((a) => ({
      id: a.id,
      stat: a.stat ?? "",
      label: a.label ?? a.id,
      maxRoll: a.maxRoll ?? 0,
      unit: a.unit ?? "percent",
      category: a.category ?? "minor_offensive",
    }));
}
```

**Step 2: Verify the `IGearAttribute` type exists and has the right shape**

Check `src/lib/types/gear.ts` — if `IGearAttribute` doesn't have `stat`, `label`, `maxRoll`, `unit`, `category`, add them.

**Step 3: Verify build compiles**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 4: Commit**

```
feat: add getAllMinorAttributes() to data-loader
```

---

### Task 3: Create `SearchableSelect` component

**Files:**
- Create: `src/components/shared/SearchableSelect.tsx`

**Step 1: Write the component**

```tsx
// Searchable select combobox — filters items as user types, click or keyboard to select
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface SearchableSelectOption {
  id: string;
  name: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string; // selected option id
  onChange: (id: string, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Display name for the selected value
  const selectedOption = options.find((o) => o.id === value);

  // Filter options by query
  const filtered = query
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(query.toLowerCase()) ||
          o.id.toLowerCase().includes(query.toLowerCase()) ||
          (o.subtitle && o.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, isOpen]);

  // Close dropdown on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Restore display name if no new selection was made
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (option: SearchableSelectOption) => {
      onChange(option.id, option.name);
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? query : selectedOption?.name ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded border border-border bg-background-tertiary text-foreground text-sm px-3 py-2 placeholder:text-foreground-secondary focus:outline-none focus:border-shd-orange transition-colors"
      />

      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-border bg-background-secondary shadow-lg"
        >
          {filtered.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
                index === highlightIndex
                  ? "bg-shd-orange/20 text-foreground"
                  : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              } ${option.id === value ? "font-medium text-shd-orange" : ""}`}
            >
              <div>{option.name}</div>
              {option.subtitle && (
                <div className="text-xs text-foreground-secondary mt-0.5">{option.subtitle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && filtered.length === 0 && query && (
        <div className="absolute z-50 mt-1 w-full rounded border border-border bg-background-secondary shadow-lg px-3 py-2 text-sm text-foreground-secondary">
          No matches found
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify build compiles**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 3: Commit**

```
feat: add SearchableSelect combobox component
```

---

### Task 4: Wire GearConfigPanel to data-loader

**Files:**
- Modify: `src/components/builder/GearConfigPanel.tsx`

**Step 1: Replace imports and add data hooks**

Add to imports:

```typescript
import { useEffect } from "react"; // already imported
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
```

**Step 2: Delete the hardcoded `MINOR_ATTRIBUTES` array (lines 38-53)**

**Step 3: Add data-loading state inside `GearConfigPanelInner`**

After the existing local state declarations, add:

```typescript
// Data-driven options loaded from data-loader
const [itemOptions, setItemOptions] = useState<SearchableSelectOption[]>([]);
const [talentOptions, setTalentOptions] = useState<SearchableSelectOption[]>([]);
const [minorAttributeData, setMinorAttributeData] = useState<IGearAttribute[]>([]);

// Load item options when source tab changes
useEffect(() => {
  async function loadItems() {
    let options: SearchableSelectOption[] = [];
    switch (source) {
      case "brand": {
        const brands = await getAllBrands();
        options = brands.map((b) => ({ id: b.id, name: b.name }));
        break;
      }
      case "gearset": {
        const sets = await getAllGearSets();
        options = sets.map((s) => ({ id: s.id, name: s.name }));
        break;
      }
      case "named": {
        const items = await getAllNamedItems();
        // Filter to items available for this slot
        const slotItems = items.filter((i) => i.slot === slot);
        options = slotItems.map((i) => ({ id: i.id, name: i.name, subtitle: i.brand }));
        break;
      }
      case "exotic": {
        const exotics = await getAllExoticGear();
        const slotExotics = exotics.filter((e) => e.slot === slot);
        options = slotExotics.map((e) => ({
          id: e.id,
          name: e.name,
          subtitle: e.talent.name,
        }));
        break;
      }
    }
    setItemOptions(options);
  }
  loadItems();
}, [source, slot]);

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
```

**Step 4: Replace the item `<input>` (Step 2: Select Item section) with `SearchableSelect`**

Replace the `<input>` and help text with:

```tsx
<SearchableSelect
  options={itemOptions}
  value={itemId}
  onChange={(id) => setItemId(id)}
  placeholder={`Search ${source} items...`}
/>
```

**Step 5: Replace the talent `<input>` with `SearchableSelect`**

Replace the talent input and help text:

```tsx
<SearchableSelect
  options={talentOptions}
  value={talentId}
  onChange={(id) => setTalentId(id)}
  placeholder="Search talents..."
/>
```

**Step 6: Replace hardcoded `MINOR_ATTRIBUTES` references with `minorAttributeData`**

In the `<select>` for minor attributes, replace `MINOR_ATTRIBUTES.map(...)` with:

```tsx
{minorAttributeData.map((a) => (
  <option key={a.id} value={a.id}>
    {a.label}
  </option>
))}
```

Update `getMinorMax` to use data:

```typescript
function getMinorMax(attrId: string): number {
  return minorAttributeData.find((a) => a.id === attrId)?.maxRoll ?? 100;
}
```

Update the value display — replace `attrDef?.unit === "%"` check with:

```typescript
const attrDef = minorAttributeData.find((a) => a.id === attr.attributeId);
// In the display span:
{attrDef?.unit === "percent"
  ? `${attr.value.toFixed(1)}%`
  : attr.value.toLocaleString()}
```

**Step 7: Verify build compiles**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 8: Commit**

```
feat: wire GearConfigPanel to data-loader with searchable dropdowns
```

---

### Task 5: Wire WeaponConfigPanel to data-loader

**Files:**
- Modify: `src/components/builder/WeaponConfigPanel.tsx`

**Step 1: Add imports**

```typescript
import SearchableSelect from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import {
  getWeaponsByType,
  getWeaponTalentsByWeaponType,
  getAllExoticWeapons,
} from "@/lib/data-loader";
import type { WeaponType } from "@/lib/types";
```

**Step 2: Add data-loading state inside `WeaponConfigPanelInner`**

```typescript
const [weaponOptions, setWeaponOptions] = useState<SearchableSelectOption[]>([]);
const [talentOptions, setTalentOptions] = useState<SearchableSelectOption[]>([]);

// Load weapons when weapon type changes
useEffect(() => {
  if (!weaponType) return;
  async function loadWeapons() {
    const [weapons, exotics] = await Promise.all([
      getWeaponsByType(weaponType as WeaponType),
      getAllExoticWeapons(),
    ]);
    const typeExotics = exotics.filter((e) => e.type === weaponType);
    const options: SearchableSelectOption[] = [
      ...weapons.map((w) => ({
        id: w.id,
        name: w.name,
        subtitle: `${w.rpm} RPM / ${w.magSize} mag`,
      })),
      ...typeExotics.map((e) => ({
        id: e.id,
        name: e.name,
        subtitle: `Exotic — ${e.talent.name}`,
      })),
    ];
    setWeaponOptions(options);
  }
  loadWeapons();
}, [weaponType]);

// Load weapon talents when weapon type changes
useEffect(() => {
  if (!weaponType) return;
  async function loadTalents() {
    const talents = await getWeaponTalentsByWeaponType(weaponType as WeaponType);
    setTalentOptions(
      talents.map((t) => ({
        id: t.id,
        name: t.name,
        subtitle: t.description.slice(0, 60) + (t.description.length > 60 ? "..." : ""),
      }))
    );
  }
  loadTalents();
}, [weaponType]);
```

**Step 3: Replace weapon `<input>` with `SearchableSelect`**

```tsx
<SearchableSelect
  options={weaponOptions}
  value={weaponId}
  onChange={(id) => setWeaponId(id)}
  placeholder={weaponType ? `Search ${weaponType}...` : "Select a weapon type first..."}
  disabled={!weaponType}
/>
```

**Step 4: Replace talent `<input>` with `SearchableSelect`**

```tsx
<SearchableSelect
  options={talentOptions}
  value={talentId}
  onChange={(id) => setTalentId(id)}
  placeholder={weaponType ? "Search weapon talents..." : "Select a weapon type first..."}
  disabled={!weaponType}
/>
```

**Step 5: Remove all "future phase" help text paragraphs**

**Step 6: Verify build compiles**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 7: Commit**

```
feat: wire WeaponConfigPanel to data-loader with searchable dropdowns
```

---

### Task 6: Wire SkillConfigPanel to data-loader

**Files:**
- Modify: `src/components/builder/SkillConfigPanel.tsx`

**Step 1: Add imports**

```typescript
import SearchableSelect from "@/components/shared/SearchableSelect";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import { getAllSkills } from "@/lib/data-loader";
```

**Step 2: Add data-loading state inside `SkillConfigPanelInner`**

```typescript
const [variantOptions, setVariantOptions] = useState<SearchableSelectOption[]>([]);

// Load skill variants when category changes
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
```

**Step 3: Replace variant `<input>` with `SearchableSelect`**

```tsx
<SearchableSelect
  options={variantOptions}
  value={variantId}
  onChange={(id) => setVariantId(id)}
  placeholder={category ? `Search ${category} variants...` : "Select a category first..."}
  disabled={!category}
/>
```

**Step 4: Remove "future phase" help text**

**Step 5: Verify build compiles**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 6: Commit**

```
feat: wire SkillConfigPanel to data-loader with searchable dropdowns
```

---

### Task 7: Fix any remaining old type references

**Step 1: Grep for stale values**

Search `src/` for: `"Assault Rifle"`, `"LMG"`, `"SMG"`, `"Shotgun"`, `"Pistol"`, `"Rifle"` (but not `"Marksman Rifle"`), `"Shield"` (in skill context), `"future phase"`, `"manually"`.

**Step 2: Fix each occurrence**

Key locations in data-loader.ts:
- Line 142: `type: (arch.type ?? cls.class) as WeaponType` — already uses data values, no change needed
- Line 291: `type: (e.category ?? "Assault Rifle") as WeaponType` → change default to `"Assault Rifles"`

**Step 3: Full build check**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 4: Commit**

```
fix: remove stale type references and future-phase placeholders
```

---

### Task 8: Final verification

**Step 1: Full type check**

Run: `cd /home/lkeneston/projects/shd-planner && npx tsc --noEmit`

**Step 2: Dev server smoke test**

Run: `cd /home/lkeneston/projects/shd-planner && npm run dev` and verify the builder page loads without console errors.

**Step 3: Push**

```bash
git push
```
