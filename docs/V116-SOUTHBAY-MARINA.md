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

### Geography contracts (verified directly in the protected game.js)

- `worldId`: `harbor-main`; `MAPS.waterfront` is **1500 × 1000**, at V115 world origin **(4400,3220)**. Southbay starts at **(2800,3220)**.
- Native Waterfront grass spans local y0–520; its actual promenade spans local y430–580 (**world y3650–3800**); water begins at local y580 (**world y3800**).
- The real game's **three walkable piers** are local x255–345, 705–795 and 1155–1245, world x **4655, 5105, 5555**, from world y**3800 to 4100**. Water outside these gaps is in the original `pedSolids`; the southern strip remains blocked.
- Native Marina Office is x**4580**, y**3360**, 300×200, with entrance near (4730,3578). Boat Shed B is at x**5020**, y**3400**, 220×150, with interaction at (5130,3572). Both existing quest sites keep their IDs and world footprints.
- Original `v115-premium-art.js` had six **decorative** piers at different world coordinates, which did not match gameplay `MAPS.waterfront`. V116 intentionally paints over that visual mismatch and restores the **three original functional piers**. No source MAPS or navigation changes.
- V116 art rectangle: x **4352–6144**, y **3220–4656**, extending into non-walkable visual sea beyond native map bounds without altering street geometry. The native North/Southbay entrances remain open.

## Implemented V116 art pipeline and gameplay integration

- 11 original reusable raster resources in `assets/v116-marina`: a **32×32 tile atlas**, four roof+facade pixel sprites, a kiosk, three boat classes, a 6-frame character sprite sheet, and a 2-frame seabird sheet.
- Reuses seven preapproved exterior WebP sprite types; does **not** copy the user reference screenshot into production textures.
- Deterministic 256×256 camera-culled raster tile chunks, capped at 40 cached chunks (10 MiB theoretical maximum RGBA cache), nearest-neighbor filtering.
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
- QA captures real game Canvas before/after at **identical coordinates (5180,3880)** and identical zoom separately for simulated Android portrait (390×844) and landscape (844×390).
- `qa/check-v116-marina.cjs` checks sprite existence, gameplay integration hooks, collision semantics and Zombie exclusions.
- `qa/capture-v116-marina.cjs` checks live browser rendering, loaded assets, walkable paths, blocked water, hidden debug panels and JavaScript errors. Its evidence and performance JSON are published under `/preview/v116-marina/evidence/` when GitHub Pages deployment succeeds.
- Actual physical Android FPS cannot be established by headless desktop Chromium; verify on the user's phone before merging or claiming sustained 60 FPS.

## Next review gates

1. Review mobile before/after screenshots and test the real connected-world marina at normal zoom.
2. Adjust artwork density, scale, collision and NPC routines where actual devices reveal problems.
3. Verify two-way walking connections from nearby streets and dock accessibility at multiple camera scales.
4. Only after approval: integrate classic campaign missions, vehicles, and persistent world state through a shared simulation boundary, without affecting Zombie Outbreak.

**Do not merge or overwrite production until approved.**

## Verified live-browser performance (optimized V116)

GitHub Actions deployment run [41259730858](https://github.com/jayrican35/rookie-harbor-city/actions/runs/41259730858) completed successfully, including the screenshot and gameplay acceptance tests for both Android-sized viewports.

| Simulated viewport | Prior renderer FPS (art disabled) | V116 art enabled FPS | V116 95th-percentile module paint time | Cached terrain chunks |
| --- | ---: | ---: | ---: | ---: |
| Portrait, 390×844 | 57.3 | 55.5 | 0.3 ms | 24 |
| Landscape, 844×390 | 60.0 | 60.0 | 0.3 ms | 20 |

The previous 18-chunk cache caused visible-viewport cache thrashing in portrait: an earlier run dropped from **51.1** without art to **32.2 FPS** with art enabled. Raising the fixed upper limit to **40 chunks** stopped the active-viewport rebuild churn; maximum cached RGBA memory is now **10 MiB** (40×256×256×4 bytes), but the test frames held 24 (portrait) and 20 (landscape) chunks. Real-device battery, memory and frame pacing still require Android verification; these FPS measurements are from headless desktop Chromium simulating mobile dimensions. All 19 PNG/WebP assets decoded without browser errors. The test additionally confirmed the original three-pier collision geometry, promenade access, and hidden development overlays.

Evidence is deployed at [the identical-camera V116 screenshot comparison](https://jayrican35.github.io/rookie-harbor-city/preview/v116-marina/evidence/): portrait and landscape before/after Canvas captures plus live UI screenshots and metrics JSON. Camera world position **(5180,3880)** for both; portrait zoom **0.82**, landscape zoom **1.04**. No screenshots from an unrelated mockup.
