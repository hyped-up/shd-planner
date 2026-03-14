# Build Intent Framework

## The Core Idea

Based on Nate Jones' intent engineering concept: beyond telling the AI what to do (lookup gear) and what to know (game data), we need to tell it what to WANT -- what outcome to optimize for when trade-offs arise.

The Division 2 build assistant currently treats every query the same. But "give me a DPS build" could mean very different things depending on intent.

## Six Build Intents

| Intent | Optimize For | Trade-off Accepted |
|---|---|---|
| **Maximum Output** | Highest possible damage/healing numbers on paper | Glass cannon, requires perfect positioning, punishes mistakes |
| **Consistency** | Reliable performance across all situations | Lower peak damage, but works even when things go sideways |
| **Farmability** | Gear that's easy to obtain and roll | May not be absolute BiS, but achievable within days not months |
| **Fun Factor** | Engaging gameplay loop, interesting mechanics | May sacrifice 10-15% efficiency for a more enjoyable playstyle |
| **Team Synergy** | Maximizes squad effectiveness, fills gaps | Individual output may be lower, but squad benefits more |
| **Versatility** | Works across multiple modes without respec | Jack of all trades, master of none |

## How to Apply

When `div2_suggest_build` is called, the assistant should:

1. Ask about intent if not specified (or infer from context)
2. Weight suggestions toward the stated intent
3. When two items are close in power, use intent to break the tie
4. Explicitly state which intent the suggestion optimizes for

### Example: A User Asks for a "Raid DPS Build"

- **Maximum Output:** Full red Striker with Glass Cannon + Vigilance, Coyote's Mask
- **Consistency:** Striker with Obliterate + Composure, Memento backpack for recovery
- **Farmability:** Providence/Grupo/Ceska brand set build (no gear set farming needed)
- **Team Synergy:** Heartbreaker with Future Initiative healer supporting

## The Klarna Trap for Division 2

The assistant could give a "perfect" Glass Cannon DPS build that's technically optimal -- but if the player dies every 30 seconds because they're not a positioning expert, the *real* DPS output is zero. Task completion (optimal build on paper) vs. goal achievement (actually clearing content).

This is the difference between answering the question asked and solving the problem the player actually has. A build that keeps you alive and dealing steady damage will always out-DPS a build that has you staring at a respawn timer.
