# Precinct 9 — Phase 1 masonry wall kit

Status: isolated visual test candidate, NOT production replacement.

## Audit
- Connected world, camera, geometry, rooms, depth sorting: published-game-capture/v115-campus.js
- Roof-alpha and legacy cast: published-game-capture/v132-precinct-heritage.js
- Existing reference-directed façade: published-game-capture/v134-precinct-reference.js
- Existing 32px tile conventions: V115 precinct pilot. 1 asset pixel = 1 world unit at zoom=1.
- Existing Canvas drawImage/nearest-neighbor sprites, native V134 paint and roof fade reused.

## Production output
The script tools/build_precinct9_wallkit_phase1.py generates PNG files into:
published-game-capture/assets/precinct9-wall-kit-phase1/

There are 26 independent RGBA PNG modules; one 1024x1024 atlas with
unrotated frames and transparent gutters; and a JSON manifest with
exact rectangles, dimensions, anchors and placements.

Reference blue-brick detail is baked as a 32x32 indexed color swatch
sampled from the user's provided source image. The original colored
bleed around the illustrations is intentionally NOT included.

## In-game assembly
The normal V134 facade renderer calls a tiny modular-atlas test method
at native world x=412,y=985. It draws a single 320x128 wall strip:
pilasters, repeatable blue bricks, stone cornice and base. The SAME
existing roof fade and depth order apply. It does NOT change colliders,
buildings, door transitions, or camera.

The browser capture size is 390x844 Android portrait.
The browser verifies the 26-module manifest and actual atlas painting,
compares real doors/walls/roads/walkability and retains Marina shots.
Aesthetic approval remains with the user.

## Scope protection
This is Phase 1: walls, stone and EMPTY window-cut wall pieces only.
No completed windows, doors, awnings, lamps, banners, signs or NPC work.
Original Zombie Outbreak, Marina, main campaign, saves, roads and
approved game are byte-for-byte unmodified.

## Placement
Use frame.atlas.x/y/w/h and drawImage(sourceCanvas, sx, sy, sw, sh,
worldX, worldY, sw, sh) in the EXISTING world Canvas. Respect the
32-pixel layout grid, nearest-neighbor sampling, and original
collision. The bottom-left anchor is recorded for future authored
facade placement, not a request to change drawImage semantics.
