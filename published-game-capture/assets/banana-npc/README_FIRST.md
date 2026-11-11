# Banana NPC — ROOKIE: Harbor City

This pack contains **Banana only**, matching the **already-installed Chicken NPC** pilot atlas conventions. Do not recreate, replace, or modify Chicken.

## Files
- `sprites/atlas/banana_walk_4x4.png` — 4 directions (down, left, right, up), 4 frames each, **112 x 120** per frame.
- `sprites/atlas/banana_idle_4x1.png` — 4 idle frames, **112 x 120** each.
- `sprites/atlas/banana_talk_4x1.png` — 4 speaking frames, **112 x 120** each.
- `sprites/atlas/banana_argue_4x1.png` — 4 larger comic arguing poses, **160 x 160** each.
- `sprites/frames/` — individual transparent PNGs.
- `portraits/` — 8 expression portraits from source board.
- `banana_manifest.json` — exact filenames and animation metadata.
- `preview.html` — quick standalone sprite-animation browser preview.
- `previews/` — checkerboard sheets for inspection.
- `reference/banana_concept_board.png` — original source illustration.

## Import into Codex
Unzip and provide Codex the folder. Tell it: “Add **only Banana** to the existing Chicken-compatible main-world NPC asset loader using `banana_manifest.json`; leave Chicken unchanged. Match Chicken's actual in-game display scale, foot anchor, collision, and walking speed. Keep Zombie Outbreak untouched; work local-only.”

## Quality note
The frames were extracted and transparent-matted from an AI-generated concept sheet and placed into consistent atlas cells. Their pose changes are subtle and may need hand-animation refinement. Check the `previews/` checkerboard images and `preview.html`; have Codex verify in game before marking production-final. Dimensions are **actual atlas dimensions**, not source-board labels (which say 32×32).
