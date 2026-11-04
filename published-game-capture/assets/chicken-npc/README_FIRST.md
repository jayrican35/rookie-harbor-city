# ROOKIE: Harbor City — Chicken NPC Pilot

This is a standalone **single-character review/import pack**. It contains actual transparent walk-frame PNGs and a 4×4 atlas, four argument poses, eight dialogue portrait crops, a manifest, an offline preview, and import guidance.

## Start here
1. Extract the ZIP.
2. Open `preview.html` in Chrome.
3. Inspect `previews/chicken_walk_checker.png` and the individual `sprites/frames/` files.
4. Give Codex this entire folder and `docs/CODEX_IMPORT.md`.

## Frames
- 4 rows: down, left, right, up.
- 4 columns: animation frames 0, 1, 2, 3.
- 112×120 RGBA PNG frame, atlas 448×480.
- Foot anchor (56,110).
- Walking 170 ms per frame suggested.
- `chicken_manifest.json` contains all paths.

## Visual quality disclosure
The walking and argument frames were isolated from generated reference art and had their dark background removed. They are **importable prototype-quality assets**, not individually hand-cleaned final animation drawings. The poses may have subtle inconsistencies and some silhouette edges may need a pixel-art cleanup. Portraits have their original artwork backgrounds and are *not* claimed to be transparent. Do not bulk-produce other NPCs from this pack until it passes in-game quality review.

Nothing has been integrated into your repository, pushed, deployed, or modified in Zombie Outbreak.
