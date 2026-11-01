# ROOKIE: Harbor City — V116 Southbay Marina Implementation Report

## Scope and visual benchmark

The user's October 31 waterfront screenshot is the visual quality goal, not replacement geometry. V116 is confined to the existing **Southbay Marina / Waterfront & Docks** area in the V115 connected-world implementation. Source branch: `feature/v115-precinct-tileset-pilot`; implementation branch: `feature/v116-southbay-marina` (draft, unmerged).

## Stage A — renderer audit

The repository is **hybrid**:

- `published-game-capture/game.js` — original self-contained Canvas campaign engine and MAPS, NPCs, missions, vehicle system, and save handling. Its private scope is used by a V115 preview-only bridge; this original file must not change.
- `published-game-capture/v115-world.js` — shared world origins, real geometry atlas, route and chunk coordinate contract.
- `published-game-capture/v115-campus.js` — the **actual walkable V115 connected-world canvas** and continuous movement/collision loop. This is the player-controlled scene modified for V116; it is not a static map image.
- `published-game-capture/v115-reference-art.js` — procedural coast, marina, foliage and city panorama; optional display layer.
- `published-game-capture/v115-premium-art.js` — SVG mountains, waterfall, lighthouse and boats plus procedural docks.
- `published-game-capture/assets/exterior/*.webp` — approved pixel-art props including palms, trees, benches, lamps, planters, bollards and trash bins.
- `published-game-capture/v115-precinct-pilot.js` — first authored raster atlas/layer experiment; V116 extends the modular pattern rather than substituting a new world renderer.

### Geography contracts

- `worldId`: `harbor-main`; V115 `waterfront` starts at `(4400, 3220)` and `southbay` at `(2800, 3220)`.
- V115 established piers at world x values **4590, 4850, 5140, 5420, 5660, 5920**, with waterfront walkway and seawall near **y=4200**. V116 preserves those positions.
- V116 art rectangle: x **4352–6144**, y **3504–4656**. No map size or road topology changes.
- Source collision stays intact. V116 adds bounded physical footprints for the four new shops/kiosk and blocks open water while leaving the existing piers accessible.

## Implemented V116 art pipeline and gameplay integration

- 11 original reusable raster resources in `assets/v116-marina`: a **32×32 tile atlas**, four roof+facade pixel sprites, a kiosk, three boat classes, a 6-frame character sprite sheet, and a 2-frame seabird sheet.
- Reuses seven preapproved exterior WebP sprite types; does **not** copy the user reference screenshot into production textures.
- Deterministic 256×256 camera-culled raster tile chunks, capped at 18 cached chunks (~4.5 MiB theoretical RGBA cache), nearest-neighbor filtering.
- Detailed plaza, promenade, seawall, reusable dock plank material, beach/water transition; transparent terrain over existing street entry so the north-south road is not visually replaced.
- Animated water glints, subtle boat bobbing, independent tree sway, warm lamp glow and resting gulls.
- Five marina NPCs with stable world IDs and short deterministic waypoints. Integrated into the existing `npcActors` array and simulation tick, not a second global game loop.
- Nine short inspect/speech interactions registered in the existing `worldSpots`/LOOK system. No campaign mission writes.
- V116 UI keeps movement and LOOK controls, hides showcase labels, debug coordinates and oversized instruction panels while the connected-world scene is open.
- One-tap `PLAY SOUTHBAY MARINA · V116` launch in the existing map overlay. Uses the existing canvas/camera, not a new level or page.
- Save namespace `rookie:v116-marina-sandbox:` — no production or regular V115 save changes.

## Compatibility boundaries and honest limitations

This is a **playable connected-world marina implementation**, not merely an art mockup. It is **not yet merged into the classic campaign engine**. The original mission/vehicle systems remain in `game.js`; their migration into V115/V116 connected-world gameplay is a separate task. The newly added shop roofs are environmental exteriors rather than fully enterable shop interiors. No actual multi-device server or network state sync was added.

All protected originals remain untouched: `game.js`, `outbreak.css`, all Zombie Outbreak maps, assets, AI, mechanics, music, controls, settings and balance. Changes are confined to V116 feature modules, one preview-only connected-world adapter, build helpers, tests, and new artwork.

## Rendering and performance validation

- Static 256×256 tile cache capped at 18 chunks; tile draw calls are bounded by camera and zoom.
- Water uses bounded simple strokes; boat/tree/seabird animations use monotonic frame time and fixed instances, not per-frame particle allocations.
- QA captures real game Canvas before/after at **identical coordinates (5130,4150)** and identical zoom separately for simulated Android portrait (390×844) and landscape (844×390).
- `qa/check-v116-marina.cjs` checks sprite existence, gameplay integration hooks, collision semantics and Zombie exclusions.
- `qa/capture-v116-marina.cjs` checks live browser rendering, loaded assets, walkable paths, blocked water, hidden debug panels and JavaScript errors. Its evidence and performance JSON are published under `/preview/v116-marina/evidence/` when GitHub Pages deployment succeeds.
- Actual physical Android FPS cannot be established by headless desktop Chromium; verify on the user's phone before merging or claiming sustained 60 FPS.

## Next review gates

1. Review mobile before/after screenshots and test the real connected-world marina at normal zoom.
2. Adjust artwork density, scale, collision and NPC routines where actual devices reveal problems.
3. Verify two-way walking connections from nearby streets and dock accessibility at multiple camera scales.
4. Only after approval: integrate classic campaign missions, vehicles, and persistent world state through a shared simulation boundary, without affecting Zombie Outbreak.

**Do not merge or overwrite production until approved.**