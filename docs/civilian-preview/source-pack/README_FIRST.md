# ROOKIE: Harbor City — All Civilian Walk Atlases

This package supplies **30 complete 4-direction × 4-frame walk atlases** of the civilian community, using the approved, detailed yellow-citizen artwork as the source. Police force NPCs are excluded.

## Files
- `atlases/`: one 512×640 transparent RGBA PNG per civilian; 4×4 frame grid; frame 128×160.
- `source_idles/`: all 30 approved role-specific still sprites.
- `previews/`: a reviewable grid for every character plus an overview of all 30.
- `frames/`: individual transparent frames for a handful of characters as extraction examples.
- `manifest.json`: role IDs and animation layout for Codex.
- `docs/CODEX_IMPLEMENTATION.md`: how to wire assets to the existing game.
- `docs/QA_JSON.json`: mechanical validation of frame counts, alpha, and file dimensions.

## Read this quality note
These are **real, importable sprites**, not a screenshot. The first direction (front/down) is animated from each character's actual approved outfit illustration. The left/right/up views are derived from the original approved walking art with character-specific colors, headgear and props. They **are not 480 independently hand-painted poses**. Some hat/garment views may need further art-directed cleanup. Inspect the previews before integration and flag any role you'd like refined.

## Animation coordinates
Each frame is 128×160 pixels. Read by row (`down`, `left`, `right`, `up`), then by frame index (0..3). Frame origin upper-left, anchor `(64,153)`, about seven frames per second. Use nearest-neighbor integer scaling when rendered in the game.

## Safety
No repo was changed. No online deployment, version change, or changes to Zombie Outbreak.

Additional exports: every single frame (480 transparent PNGs), 120 directional animated GIF previews, and the approved general expression atlas. The quality note above still applies: these are composited variations, not unique hand-painted profile/back poses.
