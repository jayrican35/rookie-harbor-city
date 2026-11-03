# Approved citywide perspective pass — local only

The owner approved expansion after the Precinct 9 pilot. The citywide pass is implemented in the existing connected-world preview at http://127.0.0.1:8767/. The review-location selector inspects all nine districts plus Precinct 9; **Citywide 3/4 / Approved pilot** compares against commit `63a8016`. It is a development inspection tool, not new gameplay fast travel. [Matching actual screenshots](http://127.0.0.1:8767/evidence/city-perspective/).

## Changes and reuse

The same vehicle adapter now covers the connected city and ten authored parked cars, retaining their dimensions/colors and the existing 18-car simulation. Genuine front/rear/east/west frames are selected without rotation. Four native parked-car paint colors were added to the existing atlas: 52 frames, still one 512×512 PNG. Live turn captures exposed neighboring-asset bleed in the pilot's front/rear crops; connected-component extraction now isolates each original vehicle body. No newly generated art was needed in this pass.

The audit found that the connected preview did not recognize production `worldBuilding`, `mchouse`, `dtBuilding`, and `sbart` records. Existing house/shop/warehouse/Southbay assets are now restored at their recorded bounds and feet anchors. Buildings and native props join the existing actor depth queue. Original Midtown RPG atlas crops take priority over distorted fallback storefronts. Residential fences/mailbox, native benches/planters/trees and other compatible props are restored without changing their collision or placement. No rooms, NPCs or furniture were moved.

Thirteen absent Southbay source files were recovered with read-only GETs from the documented public capture origin; bytes/hashes are in [recovered-assets.json](recovered-assets.json). Existing files were not overwritten. Residential source images were present but deferred by the classic map loader; the connected preview now loads those same URLs on demand without changing classic state or asset handles. Original Marina/dock, district terrain/road and canonical Jay modules remain unchanged.

## Verification

- Forty matching-camera screenshots: ten locations at 1280×720 and 390×844, before/after. They are actual game Canvas captures, not image-generated mockups.
- 1,560 static collision diagnostic samples, district coordinates, road links, station geometry and entrances match the approved pilot for each viewport. Dynamic traffic positions are excluded from parity because the simulation continues naturally.
- All four walking directions, animation phase, running, camera follow, real touch joystick input and seamless lobby entry pass. Existing Marina/café doorway, scenery collision and precinct regression checks pass.
- Actual Canvas ordering verifies front/behind occlusion for five production building types. Natural north/south traffic turns are captured in-game. Asset checks verify all three vehicle families × four directions, aspect preservation, one atlas request and classic/Academy/Zombie guards.
- No browser exceptions or newly missing assets. The same five inherited missing parking/civilian files remain.
- Original game.js, outbreak.css, world graph, Jay, Marina, city terrain and precinct façade modules match baseline hashes. Seeded Zombie map/startup/equipment smoke parity passes; connected mode is refused and its vehicle atlas remains unloaded in Zombie. Full Zombie playthrough is not certified.
- Local review location selection and before/after switching pass.

| Viewport | Before max settled p95 | After max settled p95 | Before max settled paint | After max settled paint |
|---|---:|---:|---:|---:|
| 1280×720 | 11.7 ms | 13.2 ms | 14.7 ms | 17.0 ms |
| 390×844 | 5.2 ms | 6.8 ms | 7.1 ms | 7.4 ms |

Values are the maximum of ten scene measurements after 190 settling frames, using each existing 180-frame paint-cost window. They are paint timings, not complete frame times or physical-phone FPS. Abrupt cold QA camera jumps still expose inherited first-visit terrain/cache hitches (before up to 1271.6/584.3 ms desktop/mobile; after 688.4/481.0 ms). These are recorded, not concealed as steady gameplay performance. Physical-device testing remains outstanding.

[Full evidence and results](evidence/index.html), including source protection, per-scene timings, cold timings, native-record audit and occlusion/turn diagnostics.

## Files

Runtime: `published-game-capture/v115-campus.js`, `v135-precinct-wallkit-test.js`; vehicle atlas/manifest; thirteen recovered `assets/southbay` and `assets/southbay-addon` images. The canonical engine, movement, collision code, save schema, camera, animation and Zombie files were not edited.

Tools: `prepare_city_perspective.py`, `prepare_perspective_assets.py`, `recover_city_perspective_assets.py`, `package_city_perspective.py`.

QA: `capture-city-perspective.cjs`, `check-city-perspective-assets.cjs`, `check-city-perspective-depth.cjs`; `check-v115-campus.cjs` receives its missing Canvas clip stub. `.gitignore` excludes raw local builds/logs. This report and evidence document the work.

## Scope and remaining issues

This remains the existing connected-world walkable preview. Campaign mission progression/player driving and additional seamless interiors have not been migrated; this art pass does not claim otherwise. Existing simplified civilian NPC fallbacks remain pending the separately requested NPC work. Native large-building scale differences and first-visit cache hitches remain inherited issues for a later scoped pass. Vehicle mechanics, paths, collisions, original geography and door locations are unchanged. There is no new renderer, controller, projection or simulation loop. Nothing was pushed, published or deployed, and no game version number changed.
