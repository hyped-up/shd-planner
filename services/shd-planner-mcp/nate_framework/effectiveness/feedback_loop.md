# Feedback Loop: Improving Recommendations Over Time

How in-game results should feed back into the assistant's knowledge base.

---

## Loop 1: Individual Build Feedback

After running a build in actual content:

- If the build failed, identify why (survivability? damage? wrong mode?)
- Feed the failure back to the assistant: "I tried the Striker DPS build in Legendary and kept dying to rushers"
- The assistant should adjust: more survivability, different talent, add CC skill

---

## Loop 2: Pattern Recognition

After 5+ builds tracked:

- Which roles/modes have the highest success rate?
- Which intents (fun vs. output) match your actual playstyle?
- Are you consistently swapping the same slot (e.g., always replacing the recommended backpack)?
- This reveals your personal meta -- what works for YOU, not what's theoretically best

---

## Loop 3: Knowledge Base Updates

When builds fail due to stale data:

- Check `patch_notes/update_history.json` for the last applied TU
- Run the scraper to refresh data: `uv run python scrape_wiki.py --category all`
- Re-run the build suggestion after data refresh
- If the same suggestion comes back, the issue is playstyle, not data

---

## Loop 4: Community Calibration

If sharing builds publicly:

- Track which shared builds get positive feedback
- Builds that work for multiple players are more robust than single-player optimization
- If a build consistently fails for others but works for you, it's likely playstyle-dependent (high mechanical skill, specific team comp, etc.)

---

## Metrics That Matter vs. Metrics That Don't

| Metric | Matters? | Why |
|---|---|---|
| Content cleared (yes/no) | YES | The only metric that counts |
| Deaths per run | YES | Measures survivability reality vs. theory |
| Build used as-is vs. modified | YES | Measures recommendation accuracy |
| Paper DPS number | NO | Meaningless without uptime and survival |
| Number of builds generated | NO | More builds != better results |
| Synergy score from analyzer | PARTIAL | High score is necessary but not sufficient |
| Time to assemble the build | YES | Farmability matters for player satisfaction |
