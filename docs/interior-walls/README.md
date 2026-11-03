# Precinct 9 interior walls — local architecture pass

Open http://127.0.0.1:8767/ and use **Review room** and **Improved walls / Before walls**. [Matching gameplay screenshots](http://127.0.0.1:8767/evidence/interior-walls/) cover all eleven rooms on desktop and mobile. Before is the preserved citywide commit `7da37f1`; this work does not overwrite that pass.

## Audit and implementation

The connected precinct cached floors, furniture and dark collision-width wall strips into one plate. Its existing bridge explicitly disabled wall skins, while the older craft image supplied horizontal strips only. Walls therefore appeared thin or absent, and a wall painted into that plate would remain beneath every actor.

The existing bridge now compiles the original wall rectangles into one reusable module plan. Wall faces and jambs join the existing feet-Y actor queue. Furniture uses the same original painters, art and coordinates in that queue where necessary for correct wall/furniture ordering. Floors and wall footprints retain the stationary cache and asynchronous asset-readiness invalidation. No renderer, controller, collision manager, scene, camera or animation system was replaced or duplicated.

The owner pack is preserved unchanged at `docs/references/precinct-interior-asset-sheet.png`. Selected wall, trim, badge, framed-picture, masonry, utility-light, pillar and jamb crops supply ten modules in one **512×256 atlas**, following the existing 32px grid and native-world-pixel conventions, with 48px apparent front-wall height. No image generation was used. The manifest records source crops and connection rules.

Horizontal sections, side strips, caps and ends compose corners, T-junctions and intersections from the existing wall union. The original `precinctDoors.plan/opening` functions supply all door gaps and jamb coordinates. No passage fill, new door controller or animated leaf was added. Final short horizontal modules are cropped rather than stretched. Existing barred holding-cell fronts remain intact.

Badge/picture/light variants attach directly to wall modules, selectively avoiding rooms with existing wall boards. Existing floor materials, labels, boards, furniture, locker artwork and NPC designs remain in use. The supplied furniture sections were not substituted into the game. Shadows are union-filled once in the stationary cache; dynamic wall faces add no second shadow. Nearby foreground sections fade using the current occupied-room and roof-cutaway state.

## Verification

The lobby-only pilot was implemented and verified at 1280×720 and 390×844 before enabling the same kit across the other rooms. The local review retains a separate lobby-pilot page.

- All **11 rooms, 34 wall rectangles, 44 furniture records, NPC coordinates and 16 door openings** match the before build exactly.
- A **3,969-point collision grid** matches at both viewport sizes. Every original door centre stays clear. Unit checks verify room-boundary skin coverage, immutable layout data and jambs outside the original passages.
- Real key input follows the reception-side aisle through the north lobby doorway into Operations and returns without intermediate placement hooks. A separate route exits the front entrance onto the grounds and walks back in, preserving camera follow and recording both crossings.
- Actual Canvas calls verify Jay behind/in front of the same wall. Screenshots document both cases and the front-entry cutaway. Foreground fading is exercised.
- Real mobile touch events move Jay 65+ world units in the final build. Direct storage snapshots remain unchanged during final movement scenarios. Existing animation, movement, precinct, Marina, road and traffic checks pass.
- One plan is compiled: **308 camera-culled module/jamb records**, using a shared atlas and the existing floor cache. No room-sized decorative overlays are introduced.
- No browser exceptions or missing interior-kit assets. Five inherited missing parking/civilian assets remain outside this pass.
- Original `game.js`, `outbreak.css`, world graph, Jay, Marina, city terrain and precinct façade match baseline hashes. Fresh-page Zombie startup, seeded-map and equipment parity pass. Connected mode is refused, wall drawing is disabled and **zero interior-kit requests** occur in Zombie. Unit guards also cover an already-loaded sheet. A full Zombie playthrough was not repeated.
- The local room selector and matching before/after switch work.

| Viewport | Before paint p95 | After paint p95 | Before max | After max |
|---|---:|---:|---:|---:|
| 1280×720 | 3.2 ms | 6.9 ms | 4.0 ms | 8.2 ms |
| 390×844 | 2.0 ms | 4.6 ms | 2.3 ms | 6.3 ms |

These are existing 180-frame Canvas paint windows after 190 settling frames in headless Chrome. They measure paint cost, not total frame time or physical-phone FPS. Physical-device validation remains outstanding. Full results, pilot evidence, front-entry/isolation output and protected hashes are linked in [the gallery](evidence/index.html). Screenshots are actual game captures.

## Files and reproduction

Runtime changes:

- `published-game-capture/v115-campus.js`: wall/furniture entries in the canonical depth queue and one cached wall-shadow union.
- `published-game-capture/v131-precinct-legacy-bridge.js`: wall plan, original doorway reuse, lobby scope and current-room foreground fade.
- `published-game-capture/v135-precinct-wallkit-test.js`: guarded interior atlas loading and module crops.
- `published-game-capture/assets/precinct-interior-walls/`: atlas and source-crop manifest.

Support changes: `tools/prepare_interior_wall_assets.py`, `tools/prepare_interior_wall_review.py`, `tools/package_interior_wall_evidence.py`; `qa/capture-interior-walls.cjs`, `qa/check-interior-wall-kit.cjs`, `qa/check-interior-wall-isolation.cjs`; `.gitignore`, owner reference and this evidence/report.

Rebuild assets, then run `tools/prepare_interior_wall_review.py --full`. Run the three QA scripts and the evidence packager. The existing local server serves `site/` on port 8767. The builder preserves the committed comparison and separate scoped pilot.

## Remaining scope

The original whole-precinct roof cutaway remains authoritative; no per-room roof behavior was introduced. The unused northeast void and non-room portions of the external shell retain their existing handling. Holding-cell bars, locker furniture and simplified NPC fallbacks are preserved for their separate tasks. Other interiors and campaign mission/driving migration remain outside this architecture pass.

Everything remains local. No push, publication, deployment, online-file change or game-version increment occurred.
