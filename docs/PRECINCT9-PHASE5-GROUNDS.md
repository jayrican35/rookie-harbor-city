# ROOKIE: Harbor City — Precinct 9 Phase 5

## Audit / source-of-truth

- Existing 1:1 world coordinates, 32-unit precinct art grid, road graph, station collision, original player and seamless lobby: published-game-capture/v115-campus.js.
- Existing single cached precinct landscape composition, walking paths, community lawn and car park: published-game-capture/v133-precinct-campus.js.
- Existing original south-facing stone forecourt that must draw after station floor, before Jay: published-game-capture/v134-precinct-reference.js.
- Original reusable manifest/Image/drawImage pipeline: published-game-capture/v135-precinct-wallkit-test.js.
- Other city material and road underlay: V127 existing city and V130 original road/parking marking source. Both are retained; only precinct surfaces are repainted inside existing bounding geometry.

Phase 5 starts at V138 verified character/facade depth build, including the approved Phase 1 walls, Phase 2 windows and Phase 3 seamless front entrance. Do not undo the V138 fix.

## New production assets

Run:

    python3 tools/build_precinct9_phase5_ground.py published-game-capture/assets/precinct9-ground-phase5

The builder uses a color/texture palette inspected from the user's approved 1448x1086 RGBA ground/road/plaza parts sheet. The supplied sheet has colored/multisheet bleed around tile boundaries; **the source sheet is NOT pasted into the world**. Offline Pillow reconstructs consistent, seamed-at-native-grid paver, brick, asphalt and grass modules from this palette, and cuts separate transparent lines, crosswalks, curbs, parking/accessibility paint, hedges, flowers, street lamps, drains, utility covers and corner trim.

Output: one 1024x1024 alpha atlas, one frame manifest and named individually cropped RGBA PNG modules under the Phase 5 asset folder. Frames have exact atlas rectangles, actual dimensions, native 1 pixel / 1 world unit, and anchor recommendations. No new dependencies in the browser.

## Integration

V135's **existing** atlas loader now also loads a terrain manifest/image only when the V139 review flag is enabled, exposing drawGroundSprite and fillGround to the *same* V133 and V134 cached ground painter. There is no extra scene renderer, no separate tilemap, no new animation loop or scene transition.

V133's own pavers, parking, shrubs and lamps draw modular atlas pieces directly while rendering its preexisting 2410x1720 ground cache. Civic grass retains the south precinct bounds. Harbor Avenue preserves the actual original road x149..2069 / y1721..1848 with its crosswalk x948; new asphalt is blended at lateral ends into the existing connected asphalt. The V134 original forecourt cache uses the same paver texture and rebuilds once when atlas loads, above the legacy apron and below player feet.

The original procedural ground still renders as fallback if atlas fetch fails. Original collider data is never altered. Existing decorative plantings, benches and street props are reused rather than adding duplicated sprites that would imply false solids.

## QA / acceptance

- Phase 5 test build is an **actual game** in the same Canvas world, not a static mockup.
- Browser captures matched camera at front plaza, Community Walk, parking, Harbor Avenue crossing, civic green and doorway on 390x844 Android and 1280x720 desktop.
- Assertions compare original real-world geometry, both door coordinates, road crossing, main entrance, player identity, roof fade, and genuine keyboard-driven entry/exit against V138.
- QA also requires the source PNG atlas to have loaded and painted into the original cached world, and checks that the original game.js, outbreak.css, road-data, vehicle controls, Marina, player controller, original Phase 1-3 atlases and save-related files are byte-identical.

**Zombie Outbreak is completely untouched.** Phase 5 remains an unmerged draft until artistic approval. No citywide terrain migration; no subsequent decorative phase implemented.
