# Jared Poker Dashboard

Static GitHub Pages dashboard for poker session tracking, tagged hand review, study focus, and interactive preflop charts.

## What it tracks
- Session-level results
- VPIP / PFR / 3-bet snapshots
- Tagged hands (coolers, bad hands, good hands, study hands)
- Current study focus and session notes
- Interactive **PFR charts by position**
- Interactive **3-bet charts by position/scenario**

## Current workflow
1. Save a hand history file to `raw_hh/`
2. Run the importer:
   ```bash
   python3 scripts/import_poker_hh.py raw_hh/<filename>.txt --hero PopeMyCherry --platform "ACR"
   ```
3. If needed, manually override the session result inside `data/sessions.json`
4. Add or refine tagged notes in `data/hands.json`
5. Adjust chart ranges in `data/pfr-ranges.json` and `data/3bet-ranges.json` if we want to tighten or loosen them
6. Commit and push to GitHub to update Pages

## Files
- `index.html` – dashboard shell
- `styles.css` – styling
- `app.js` – client-side rendering
- `data/sessions.json` – session summaries
- `data/hands.json` – tagged reviewed hands
- `data/all_hands.json` – all parsed hands for future analysis
- `data/study.json` – study notes, leak lists, top hands
- `data/pfr-ranges.json` – interactive raise-first-in charts by position
- `data/3bet-ranges.json` – interactive 3-bet charts by scenario
- `scripts/import_poker_hh.py` – parser/importer

## Notes
- The parser is good for building the running dataset, but manual result overrides are supported because rebuys, partial cash-outs, or site-specific formats can create edge cases.
- The current seed session uses a manual result override because the session included a rebuy and a major cooler (KK into AA).
- The new interactive charts are **practical approximations**, not solver-perfect ranges. The point is fast, repeatable discipline — especially for Jared’s current blind-defense and marginal-preflop leaks.
