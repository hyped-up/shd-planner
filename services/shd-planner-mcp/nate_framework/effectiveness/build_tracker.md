# Build Effectiveness Tracker

Track whether the assistant's recommendations actually work in practice.

Based on Nate Jones' Klarna principle: measure OUTCOMES (did I clear the content?) not TASKS (did AI give me a build?).

---

## Tracking Template

Copy this template for each build you test in-game.

```markdown
## Build: [name]
- **Date suggested:** YYYY-MM-DD
- **Intent:** [maximum output / consistency / farmability / fun / team synergy / versatility]
- **Mode:** [legendary / raid / pvp / countdown / descent]
- **Role:** [dps / tank / healer / skill / hybrid]

### Gear Used
| Slot | Item | As Recommended? | Substitution? |
|---|---|---|---|
| Mask | | Yes/No | [what was used instead] |
| Chest | | Yes/No | |
| Holster | | Yes/No | |
| Backpack | | Yes/No | |
| Gloves | | Yes/No | |
| Kneepads | | Yes/No | |
| Primary | | Yes/No | |
| Secondary | | Yes/No | |

### Performance
- **Content cleared?** Yes / No / Partially
- **Deaths per run:** [number]
- **Felt survivable?** Yes / Sometimes / No
- **Damage output felt:** Strong / Adequate / Weak
- **Fun to play?** Yes / Neutral / No
- **Would use again?** Yes / With changes / No

### Notes
[What worked, what didn't, what would you change]

### Verdict
- [ ] Build works as recommended
- [ ] Build needs adjustments (note above)
- [ ] Build doesn't work for this content
- [ ] Data was stale (something changed since last TU)
```

---

## Why This Matters

The Klarna trap for Division 2: the assistant gives a "perfect" build (task metric: build generated) but you keep dying in Legendary (outcome metric: content cleared = NO). Without tracking, you'd keep asking for builds and keep failing -- never identifying that the real problem is your playstyle doesn't match Glass Cannon recommendations.

---

## Quarterly Review Questions

1. How many builds did the assistant suggest vs. how many you actually used?
2. Of builds used, what % cleared the target content?
3. Which build intent (fun/output/consistency) had the highest success rate?
4. Were any builds abandoned because gear was too hard to farm?
5. Did any builds reveal stale data (post-TU changes not reflected)?
