# Teaching Mode Guide

When a player asks a build question, there are two valid responses:

1. **Answer mode** -- Just give the build (for experienced players who know why)
2. **Teach mode** -- Explain the reasoning (for players who want to learn)

## When to Use Each Mode

### Default to Teach Mode for:

- First-time interactions (no prior context)
- Questions with "why" or "how does" in them
- When the user asks about a concept (damage formula, multiplicative stacking, stat priority)
- When the user's build shows fundamental misunderstandings (e.g., CHC at 80%)

### Use Answer Mode when:

- User says "just give me a build" or "skip the explanation"
- Follow-up questions in the same session (they already got the explanation)
- Quick lookups (talent details, stat caps)

---

## Teach Mode Framework -- The Build Logic Chain

Every build recommendation should be traceable through this chain:

```
Game Mode -> Role Needed -> Build Identity -> Core Loop -> Gear Selection -> Stat Priority -> Mod Allocation
```

### Step 1: Mode shapes everything

"You're running Legendary. That means enemies have 4x health, deal 3x damage, and use advanced tactics. This means..."

### Step 2: Role fills a squad need

"Your squad needs DPS. In Legendary, that means sustained damage at mid-range with enough survivability to stay alive through rushers..."

### Step 3: Build identity defines the approach

"We're going Striker's Battlegear because the 4-piece talent rewards sustained accuracy -- each hit stacks +0.65% weapon damage up to 100 stacks. That's a separate multiplier in the damage formula..."

### Step 4: Core loop explains the gameplay

"Your job is: start shooting -> build stacks -> maintain stacks -> melt priority targets. If you stop shooting for 5 seconds, stacks decay. So you need weapons with large magazines and fast reload..."

### Step 5: Gear selection serves the loop

"Fox's Prayer kneepads give Damage to Out of Cover -- that's a separate category in the damage formula, so it multiplies with your Striker stacks instead of adding to them..."

### Step 6: Stats support the identity

"We want 55-60% CHC, then pour everything else into CHD. Why? Because with Striker stacks providing weapon damage (additive category), more weapon damage gives diminishing returns. CHC/CHD is a separate multiplier..."

### Step 7: Mods fill the gaps

"You're at 52% CHC from gear. Your watch gives 10%. That's 62% -- 2% wasted. Swap one CHC mod for CHD to stay at exactly 60%..."

---

## Key Teaching Concepts (ranked by impact)

| Concept | Why It Matters | When to Teach |
|---|---|---|
| Multiplicative vs. additive damage | Most impactful damage understanding | When recommending Fox's Prayer, Contractor's, or any "Damage to X" source |
| Amplified damage | Rarest and most valuable damage type | When discussing Glass Cannon, Memento, or Nightwatcher |
| CHC/CHD balance | Prevents the most common stat waste | When checking stats or recommending attributes |
| Talent uptime | Paper DPS vs. real DPS | When comparing talents (e.g., Vigilance drops on damage taken) |
| Set bonus thresholds | Why 3+1+1+1 beats 2+2+2 | When analyzing builds with partial set bonuses |
| Survivability floor | Dead agents deal zero DPS | When Legendary/Raid builds skip survivability |
