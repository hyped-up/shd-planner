// Gear slot names
export const GEAR_SLOTS = [
  "Mask",
  "Backpack",
  "Chest",
  "Gloves",
  "Holster",
  "Kneepads",
] as const;

// Weapon types
export const WEAPON_TYPES = [
  "Assault Rifles",
  "Submachine Guns",
  "Light Machine Guns",
  "Rifles",
  "Marksman Rifles",
  "Shotguns",
  "Pistols",
] as const;

// Core attribute types with display colors
export const CORE_ATTRIBUTE_TYPES = {
  weaponDamage: { label: "Weapon Damage", color: "#E5534B" },
  armor: { label: "Armor", color: "#539BF5" },
  skillTier: { label: "Skill Tier", color: "#DAAA3F" },
} as const;

// SHD orange brand color
export const SHD_ORANGE = "#FF6A00";
export const SHD_ORANGE_HOVER = "#FF8533";

// Game caps
export const MAX_GEAR_SCORE = 515;
export const MAX_SHD_LEVEL = 1000;

// Attribute color mappings (core attribute type → color hex)
export const ATTRIBUTE_COLORS = {
  red: "#E5534B",
  blue: "#539BF5",
  yellow: "#DAAA3F",
} as const;

// Weapon slots
export const WEAPON_SLOTS = ["primary", "secondary", "sidearm"] as const;

// Skill slots
export const SKILL_SLOTS = ["skill1", "skill2"] as const;

// Skill categories
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

// Specializations
export const SPECIALIZATIONS = [
  "Survivalist",
  "Demolitionist",
  "Sharpshooter",
  "Gunner",
  "Technician",
  "Firewall",
] as const;
