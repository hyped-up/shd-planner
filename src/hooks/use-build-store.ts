// Zustand store for build planner state management with undo/redo and localStorage persistence

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  IBuild,
  IBuildGearPiece,
  IBuildSkill,
  IBuildStats,
  IBuildWeapon,
  ISHDWatchConfig,
  IValidationError,
  GearSlot,
  WeaponSlot,
  SpecializationType,
} from "@/lib/types";

// Maximum number of undo states to keep in memory
const MAX_UNDO_STACK = 50;

/** Generate a simple UUID v4 */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Create a zeroed-out SHD Watch config */
function createEmptySHDWatch(): ISHDWatchConfig {
  return {
    weaponDamage: 0,
    armor: 0,
    skillTier: 0,
    criticalHitChance: 0,
    criticalHitDamage: 0,
    headshotDamage: 0,
    health: 0,
  };
}

/** Create a zeroed-out build stats object */
function createEmptyStats(): IBuildStats {
  return {
    totalWeaponDamage: 0,
    totalArmor: 0,
    totalSkillTier: 0,
    totalHealth: 0,
    criticalHitChance: 0,
    criticalHitDamage: 0,
    headshotDamage: 0,
    weaponHandlingBonus: 0,
    skillDamage: 0,
    repairSkills: 0,
    skillHaste: 0,
    skillDuration: 0,
    hazardProtection: 0,
    explosiveResistance: 0,
    activeBrandBonuses: [],
    activeGearSetBonuses: [],
    activeTalents: [],
    dps: { bodyshot: 0, optimal: 0, headshot: 0 },
  };
}

/** Create a new empty build with all null slots and a generated UUID */
export function createEmptyBuild(): IBuild {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: "New Build",
    description: "",
    gear: {},
    weapons: {
      primary: null,
      secondary: null,
      sidearm: null,
    },
    skills: {
      skill1: null,
      skill2: null,
    },
    specialization: null,
    shdWatch: createEmptySHDWatch(),
    createdAt: now,
    updatedAt: now,
    dataVersion: "1.0.0",
  };
}

/** Build store state shape */
interface BuildStoreState {
  currentBuild: IBuild;
  computedStats: IBuildStats;
  validationErrors: IValidationError[];
  savedBuilds: IBuild[];
  undoStack: IBuild[];
  redoStack: IBuild[];
  isDirty: boolean;
}

/** Build store actions */
interface BuildStoreActions {
  // Gear mutations
  setGearPiece: (slot: GearSlot, piece: IBuildGearPiece | null) => void;
  setWeapon: (slot: WeaponSlot, weapon: IBuildWeapon | null) => void;
  setSkill: (slot: "skill1" | "skill2", skill: IBuildSkill | null) => void;
  setSpecialization: (spec: SpecializationType | null) => void;
  setSHDWatch: (config: ISHDWatchConfig) => void;

  // Slot management
  clearSlot: (slot: GearSlot | WeaponSlot | "skill1" | "skill2") => void;
  clearBuild: () => void;

  // Build library
  saveBuild: (name: string, description?: string) => void;
  loadBuild: (id: string) => void;
  deleteBuild: (id: string) => void;
  duplicateBuild: (id: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Import / Export
  importBuild: (build: IBuild) => void;
  exportBuild: () => IBuild;

  // Build name/description
  setBuildName: (name: string) => void;
  setBuildDescription: (description: string) => void;
}

type BuildStore = BuildStoreState & BuildStoreActions;

/** Push current build to undo stack and clear redo (called before every mutation) */
function pushUndo(state: BuildStoreState): Partial<BuildStoreState> {
  const undoStack = [...state.undoStack, structuredClone(state.currentBuild)];
  // Trim to max size
  if (undoStack.length > MAX_UNDO_STACK) {
    undoStack.shift();
  }
  return { undoStack, redoStack: [], isDirty: true };
}

/** Update the timestamp on a build */
function touch(build: IBuild): IBuild {
  return { ...build, updatedAt: new Date().toISOString() };
}

// Gear slot names for type narrowing
const GEAR_SLOT_SET = new Set<string>(["Mask", "Backpack", "Chest", "Gloves", "Holster", "Kneepads"]);
const WEAPON_SLOT_SET = new Set<string>(["primary", "secondary", "sidearm"]);

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => ({
      // --- State ---
      currentBuild: createEmptyBuild(),
      computedStats: createEmptyStats(),
      validationErrors: [],
      savedBuilds: [],
      undoStack: [],
      redoStack: [],
      isDirty: false,

      // --- Gear mutations ---
      setGearPiece: (slot, piece) =>
        set((state) => {
          const undo = pushUndo(state);
          const gear = { ...state.currentBuild.gear };
          if (piece) {
            gear[slot] = piece;
          } else {
            delete gear[slot];
          }
          return {
            ...undo,
            currentBuild: touch({ ...state.currentBuild, gear }),
          };
        }),

      setWeapon: (slot, weapon) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: touch({
              ...state.currentBuild,
              weapons: { ...state.currentBuild.weapons, [slot]: weapon },
            }),
          };
        }),

      setSkill: (slot, skill) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: touch({
              ...state.currentBuild,
              skills: { ...state.currentBuild.skills, [slot]: skill },
            }),
          };
        }),

      setSpecialization: (spec) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: touch({ ...state.currentBuild, specialization: spec }),
          };
        }),

      setSHDWatch: (config) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: touch({ ...state.currentBuild, shdWatch: config }),
          };
        }),

      // --- Slot management ---
      clearSlot: (slot) => {
        if (GEAR_SLOT_SET.has(slot)) {
          get().setGearPiece(slot as GearSlot, null);
        } else if (WEAPON_SLOT_SET.has(slot)) {
          get().setWeapon(slot as WeaponSlot, null);
        } else {
          get().setSkill(slot as "skill1" | "skill2", null);
        }
      },

      clearBuild: () =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: createEmptyBuild(),
            computedStats: createEmptyStats(),
            validationErrors: [],
          };
        }),

      // --- Build library ---
      saveBuild: (name, description) =>
        set((state) => {
          const buildToSave: IBuild = touch({
            ...state.currentBuild,
            name,
            description: description ?? state.currentBuild.description,
          });
          // Replace if ID exists, otherwise append
          const existingIndex = state.savedBuilds.findIndex((b) => b.id === buildToSave.id);
          const savedBuilds =
            existingIndex >= 0
              ? state.savedBuilds.map((b, i) => (i === existingIndex ? buildToSave : b))
              : [...state.savedBuilds, buildToSave];
          return {
            currentBuild: buildToSave,
            savedBuilds,
            isDirty: false,
          };
        }),

      loadBuild: (id) =>
        set((state) => {
          const build = state.savedBuilds.find((b) => b.id === id);
          if (!build) return state;
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: structuredClone(build),
            isDirty: false,
          };
        }),

      deleteBuild: (id) =>
        set((state) => ({
          savedBuilds: state.savedBuilds.filter((b) => b.id !== id),
        })),

      duplicateBuild: (id) =>
        set((state) => {
          const build = state.savedBuilds.find((b) => b.id === id);
          if (!build) return state;
          const now = new Date().toISOString();
          const duplicate: IBuild = {
            ...structuredClone(build),
            id: generateId(),
            name: `${build.name} (Copy)`,
            createdAt: now,
            updatedAt: now,
          };
          return {
            savedBuilds: [...state.savedBuilds, duplicate],
          };
        }),

      // --- Undo / Redo ---
      undo: () =>
        set((state) => {
          if (state.undoStack.length === 0) return state;
          const undoStack = [...state.undoStack];
          const previous = undoStack.pop()!;
          return {
            undoStack,
            redoStack: [...state.redoStack, structuredClone(state.currentBuild)],
            currentBuild: previous,
            isDirty: true,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.redoStack.length === 0) return state;
          const redoStack = [...state.redoStack];
          const next = redoStack.pop()!;
          return {
            redoStack,
            undoStack: [...state.undoStack, structuredClone(state.currentBuild)],
            currentBuild: next,
            isDirty: true,
          };
        }),

      // --- Import / Export ---
      importBuild: (build) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: structuredClone(build),
          };
        }),

      exportBuild: () => structuredClone(get().currentBuild),

      // --- Name / Description ---
      setBuildName: (name) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: touch({ ...state.currentBuild, name }),
          };
        }),

      setBuildDescription: (description) =>
        set((state) => {
          const undo = pushUndo(state);
          return {
            ...undo,
            currentBuild: touch({ ...state.currentBuild, description }),
          };
        }),
    }),
    {
      name: "shd-planner-builds",
      // Only persist savedBuilds to localStorage (not transient state)
      partialize: (state) => ({
        savedBuilds: state.savedBuilds,
      }),
    }
  )
);
