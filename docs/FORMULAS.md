# Division 2 Damage Formulas

Reference documentation for the damage calculation engine used by the SHD Planner.

## Core Damage Formula

The Division 2 uses a **two-layer multiplicative system** separating additive and amplified damage sources:

```
Final Hit Damage = Base Damage x (1 + Total Additive WD%) x Amp1 x Amp2 x ... x AmpN
```

### Additive vs Amplified: The Key Distinction

| Type | How It Stacks | Example Sources |
|------|--------------|-----------------|
| **Additive** | All additive sources sum into a single bucket, then applied as one multiplier | Weapon damage from cores, brand bonuses, SHD watch, gear attributes |
| **Amplified** | Each amplified source is its own independent multiplier | Glass Cannon, Vigilance, Focus, Composure, Spark, Combined Arms |

**Why this matters:** Adding 15% weapon damage (additive) to an existing 90% additive pool increases total damage by ~8%. Adding 15% amplified increases total damage by a full 15% because it multiplies the entire result.

### Additive Sources

All additive weapon damage stacks into one bucket:

- **Red core attributes:** +15% weapon damage each (max 6 = 90%)
- **Brand bonuses:** e.g., Providence 1pc = +15% weapon damage
- **SHD Watch:** up to +10% weapon damage
- **Gear minor attributes:** weapon-type-specific damage bonuses
- **Specialization passives:** weapon-type-specific damage bonuses

```
Total Additive = sum of all additive percentages
Additive Multiplier = (1 + Total Additive)
```

Example: 6 red cores (90%) + Providence 1pc (15%) + Watch (10%) = 115% additive

```
Additive Multiplier = 1 + 1.15 = 2.15
```

### Amplified Sources

Each amplified bonus is an independent multiplier:

| Talent | Bonus | Notes |
|--------|-------|-------|
| Glass Cannon | +25% | Also increases incoming damage by 60% |
| Vigilance | +25% | Deactivates for 4s when taking damage |
| Focus | up to +60% | Requires scoping in for full bonus; builds over time |
| Composure | +15% | Active while in cover |
| Spark | +15% | Active when status-applying skill is deployed |
| Combined Arms | +30% | Active while skill is attacking |
| Obliterate | +25% | 5 stacks of 5%, requires critical hits |
| Concussion | +10% | On headshot kill |
| Tag Team | +40% | Alternating weapon/skill damage |

```
Amplified Multiplier = (1 + Amp1) x (1 + Amp2) x ... x (1 + AmpN)
```

Example: Glass Cannon (25%) + Vigilance (25%)

```
Amplified Multiplier = 1.25 x 1.25 = 1.5625
```

### Complete Example

A build with:
- Base weapon damage: 100,000
- 6 red cores: 90% additive
- Providence 1pc: 15% additive
- SHD Watch: 10% additive
- Glass Cannon: 25% amplified
- Vigilance: 25% amplified

```
Hit Damage = 100,000 x (1 + 0.90 + 0.15 + 0.10) x 1.25 x 1.25
           = 100,000 x 2.15 x 1.5625
           = 335,937
```

## DPS Calculations

### Body DPS

Raw damage per second assuming all body shots, no crits:

```
Body DPS = Hit Damage x (RPM / 60)
```

### Critical Hit DPS

Weighted average of non-crit and crit damage based on CHC:

```
Crit DPS = (1 - CHC) x Body DPS + CHC x Body DPS x (1 + CHD)
```

- **CHC** = Critical Hit Chance (capped at 60%)
- **CHD** = Critical Hit Damage (base 25%, no cap)

Example: 60% CHC, 170% CHD, 1,000,000 body DPS

```
Crit DPS = (0.40 x 1,000,000) + (0.60 x 1,000,000 x 2.70)
         = 400,000 + 1,620,000
         = 2,020,000
```

### Headshot DPS

All shots landing as headshots:

```
Headshot DPS = Body DPS x (1 + HSD)
```

- **HSD** = Headshot Damage bonus (varies by weapon type and bonuses)

### Sustained DPS

Factors in magazine dumps and reload downtime for realistic sustained output:

```
Mag Dump Time = Magazine Size / (RPM / 60)
Cycle Time = Mag Dump Time + Reload Speed
Sustained DPS = (Hit Damage x Magazine Size) / Cycle Time
```

Example: 100,000 hit damage, 30-round mag, 600 RPM, 2s reload

```
Mag Dump Time = 30 / 10 = 3 seconds
Cycle Time = 3 + 2 = 5 seconds
Sustained DPS = (100,000 x 30) / 5 = 600,000
```

## Stat Caps and Base Values

| Stat | Base Value | Cap |
|------|-----------|-----|
| Armor (per blue core) | 170,370 | 6 cores = 1,022,220 |
| Health | 245,000 | No hard cap |
| Critical Hit Chance | 0% | 60% |
| Critical Hit Damage | 25% | No cap |
| Headshot Damage | 0% (weapon native varies) | No cap |
| Skill Tier | 0 | 6 |
| Weapon Damage per red core | ~15% | 6 cores = 90% |

## Skill Tier Scaling

Each skill tier adds approximately 10% to base skill stats:

```
Effective Skill Stat = Base Stat x (1 + Tier x 0.10)
```

Skill haste reduces cooldown:

```
Effective Cooldown = Base Cooldown / (1 + Skill Haste%)
```

Tier 6 provides 60% increased skill stats over Tier 0.
