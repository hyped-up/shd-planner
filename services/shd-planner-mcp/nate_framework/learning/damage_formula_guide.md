# The Division 2 Damage Formula -- Explained for Builders

This is the reference document the assistant uses when teaching damage calculation.

## The Formula (full version)

```
Final Damage = Base Weapon Damage
  x (1 + Total Weapon Damage%)           -- [Category A: Weapon Damage]
  x (1 + Sum of Amplified Sources)       -- [Category B: Amplified - EACH IS SEPARATE]
  x (1 + Sum of Additive Damage%)        -- [Category C: Additive - stacks diminish]
  x (1 + Headshot Multiplier)            -- [Category D: Headshot]
  x (1 + CHD x CHC)                      -- [Category E: Critical]
  x (1 + Damage to Armor%)               -- [Category F: Armor Damage]
  x (1 + Damage to Health%)              -- [Category G: Health Damage]
  x (1 + Damage to Out of Cover%)        -- [Category H: Out of Cover]
```

## The Key Insight

Within a category, bonuses ADD together (diminishing returns).
Across categories, bonuses MULTIPLY together (compounding returns).

---

## Example to Teach With

Base damage: 100,000

- 60% Weapon Damage (from red cores) -- Category A
- 25% Amplified Damage (from Glass Cannon) -- Category B
- 15% Damage to Armor (from Fox's Prayer) -- Category F

**Wrong way to think about it (additive):**

```
100,000 x (1 + 0.60 + 0.25 + 0.15) = 100,000 x 2.00 = 200,000
```

**Right way (multiplicative across categories):**

```
100,000 x 1.60 x 1.25 x 1.15 = 100,000 x 2.30 = 230,000
```

That's a 15% difference from the same stat budget. Spreading bonuses across categories always wins.

---

## Why Fox's Prayer and Contractor's Gloves Are Meta

- Damage to Out of Cover (Fox's) is Category H -- a category most builds have ZERO in otherwise
- Damage to Armor (Contractor's) is Category F -- same thing
- Adding a new multiplier to an empty category is worth far more than adding +6% to an existing category

---

## Practical Teaching Table

| Stat Source | Category | Type | Value |
|---|---|---|---|
| Red core attributes (Weapon Damage) | A | Additive within A | ~15% each |
| Providence 3pc (Weapon Damage) | A | Additive within A | +10% |
| Obliterate talent stacks | C | Additive within C | +25% (max) |
| Glass Cannon (chest) | B | Amplified (separate) | +30% |
| Vigilance (backpack) | B | Amplified (separate) | +25% |
| Fox's Prayer (kneepads) | H | Separate multiplier | +8% DTOC |
| Contractor's Gloves | F | Separate multiplier | +8% DTA |
| Striker 4pc stacks | A | Additive within A | Up to +100% |
| Coyote's Mask CHD bonus | E | Additive within E (CHD) | Variable |

---

## Common Misunderstandings

1. **"All damage bonuses are the same"** -- No. 8% DTA (new multiplier) > 8% Weapon Damage (added to existing 60%+).

2. **"Stacking one stat is best"** -- No. Multiplicative spread always beats single-category stacking.

3. **"Amplified and additive are the same"** -- No. Each amplified source is its own multiplier. Two 15% amplified = 1.15 x 1.15 = 1.32, not 1.30.

4. **"CHD is always better than CHC"** -- Depends on your ratio. CHC/CHD are linked: expected crit bonus = CHC x CHD. Optimize the product, not one side.
