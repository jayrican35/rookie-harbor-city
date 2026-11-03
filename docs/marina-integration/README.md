# Bayview waterfront and Marina Bait & Tackle

The Bayview waterfront shown in the user's screenshot now joins the existing Southbay Marina visually and physically. Bayview's water formerly used brick cells from the shared terrain sheet, while a second sloping coastline collision mask cut across its native shoreline. The waterfront now uses the existing animated Marina water renderer at Bayview's original shoreline, with a timber edge, stone quay, moored boats, and a clear route around the eastern seawall into Marina. The original Bayview pier and three Marina piers retain their dimensions and coordinates.

The blue-roofed Marina Bait & Tackle occupies Bayview's existing marina-office building footprint. Its former placeholder location in the Marina is removed. The same roof-fade, room walls, world furniture queue, NPC loop, interaction points, camera, and player movement handle the new shop. Jay walks through its physical door; the roof reveals wooden floors, a register counter, tackle displays, rod rack, live-bait cooler, glass display case, stock crate, bench, nautical decorations, and lighting. The shopkeeper serves from behind the counter; a customer follows a short entrance/shopping/exit route. There is no second interior or scene engine.

Palm planters, flowers, lamps, mooring cleats, rope, safety equipment, timber posts, an angler, and a strolling visitor extend the existing waterfront composition. Existing café, residential art, water effects, boat bobbing, gulls, staff, and original Marina scenery remain in use. Boats are on blocked water beside the piers. New fixtures use visible foot-level collision; the original building collision is replaced only by an exact footprint match for its real walls and furnishings.

## Assets

Two unique supplied asset sheets are preserved in `references`: `southbay_marina_pixel_asset_atlas.png` and `marina_bait_tackle_tileset.png`. The second and third image attachments were byte-identical (SHA-256 `b335be3911715f8c3286d1f664c58ba24bea47cbe8da93e0b0cabae0653c912e`), so they share one source. The concept board guides composition, without replacing the map geometry.

`tools/prepare_marina_assets.py` extracts 20 individual components with transparent boundaries. The manifest records each crop. Used components include the shop exterior, rod rack, lures, cooler, net, crate, life ring, fish sign, flower box, wall lamp, mooring rope/cleat, safety ring, rowboat, fishing boat, sailboat, and wood flooring. Existing Marina water/foam/glints, dock texture/post art, palm/lamp sprites, character walk sheets, and world furniture rendering are reused. Whole reference sheets are never drawn into the game.

## Validation

- Ordinary keyboard movement connects Bayview to Marina and returns along all three original piers; it also reaches the Bayview pier end around its visible fittings and angler.
- Ordinary movement enters and exits the shop, preserving world and instance IDs and zero scene loads. Roof fade, camera follow, furniture interaction, and roof restoration pass. A local recording demonstrates these routes.
- 1,188 static route samples at 2px intervals and player radius 12 find zero obstructions. The room flood finds 1,167 reachable 4px cells; all seven solid furnishings block and have a reachable interaction approach. Water and walls block while the door stays clear.
- NPC route checks pass against production geometry and scenery. The added customer respects the existing collision loop and disappears under the opaque roof when Jay is outside.
- Desktop 1280×800 and portrait 390×844 matching screenshots have no browser exceptions. Mobile pointer joystick movement passes.
- Comparable headless performance without recording: desktop 44.3 → 41.8 FPS, portrait 60 → 60, landscape 60 → 60. Frame p95: 33.4ms desktop, 16.8ms mobile viewports, before and after. These are short emulated local samples, not physical-phone benchmarks. Recorded demonstration performance is separately logged and includes encoding overhead.
- All nine source district map datasets have identical before/after hashes. Changes to rendering/ownership are confined to Bayview/Marina; original campaign maps are not mutated. Road topology and traffic tests pass.
- Zombie startup, seeded map hash and connected-world exclusion match. Protected engine, Zombie stylesheet, road graph, Jay renderer, NPC walk renderer, precinct art and interior bridge sources match local baseline `21be433` after line-ending normalization. Game version numbers are unchanged.
- Existing Marina, water material, pier depth, scenery collision, roof depth, mobile HUD, running, city-art and campus regression checks pass.

No known navigation or entry blockers remain on the tested routes. Physical-device performance testing remains outstanding. Campaign driving and mission migration are outside this change.

## Review and reproduction

Open the [local playable waterfront](http://127.0.0.1:8767/) and [evidence gallery](http://127.0.0.1:8767/evidence/marina-integration/). The gallery includes before/after views, the shop interior, the gameplay video and raw test results. Everything remains inside the local clone; nothing is pushed or published.

With the existing roads-updated build and local server available:

```text
python tools/prepare_marina_assets.py
python tools/prepare_marina_integration.py
node qa/check-marina-integration.cjs
node qa/audit-marina-navigation.cjs
node qa/check-marina-isolation.cjs
node qa/measure-marina-performance.cjs
python tools/package_marina_integration.py
node qa/check-marina-review.cjs
```

Browser checks require Playwright and Chrome. The asset script uses the archived reference copies once prepared.

## Changed files

- `published-game-capture/v116-marina.js`: Bayview waterfront layer, footprint-owned bait shop, fixtures, furnishings and three actors through existing APIs.
- `published-game-capture/v120-marina-art.js`: existing water and dock painters accept optional bounds/dimensions; original defaults remain identical.
- `published-game-capture/v127-citywide-art.js`: Bayview coastline delegated to its authored waterfront; minimap reflects the bay and pier.
- `published-game-capture/v116-marina-hud.js`: native Marina minimap bounds remain local; Bayview uses the city minimap.
- `published-game-capture/v115-campus.js`: two decoration-ownership checks suppress replaced Bayview art in existing drawing passes.
- `published-game-capture/assets/marina-integration/`: extracted raster sprites, crop manifest and contact sheet.
- `tools/prepare_marina_assets.py`, `tools/prepare_marina_integration.py`, `tools/package_marina_integration.py`, `tools/marina_integration_review.html`: reproducible local assets/build/review/evidence.
- New Marina gameplay/navigation/isolation/performance QA and updated existing Marina regression expectations for the relocated footprint and bounded painter API.
- `docs/marina-integration/` and `.gitignore`: supplied references, saved evidence, report and temporary-output exclusions.
