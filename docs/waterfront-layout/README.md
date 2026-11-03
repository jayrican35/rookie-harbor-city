# Bayview corner and dock walking space

The user clarified that the two waterfront homes should become the bait shop and marina gateway shown in the reference, then explicitly selected replacement of both houses. This revision implements that composition and opens the walking routes around every dock.

## Result

- One blue-roofed bait shop replaces the two corner homes. Its previous location returns to the existing marina-office artwork and collision. The furnished interior moves with the shop and still uses continuous coordinates, the same roof fade, camera, furniture, NPC and movement systems.
- A Southbay Marina gateway, extracted from the supplied concept board's isolated modular asset, marks a broad timber arrival deck. Its main section is 260px wide, with a 360px lower platform, connecting Bayview's boardwalk, the existing Marina promenade and the original piers. Wood planks use one world-aligned grid across the joined deck rectangles.
- Two short road segments connect the shop frontage to the existing Bayview road. They use the existing road graph, material/curb renderer and original coordinates. The 24-segment canonical network remains connected.
- Marina benches, flowers, lamps, palms and bins sit toward the garden side, leaving a clear promenade band. Bayview benches and lamps move off the timber walking strip. The old house planters and corner tree are removed from the new entrance area.
- Mooring cleats, rope coils and piling anchors move outboard. The three 90px Marina decks and 60px Bayview pier keep their original widths. Jay can walk each center line and return without weaving around fittings. The Bayview angler moves onto the broad arrival deck; the Marina fisherman stays on one edge. Promenade visitors use the furnishing side rather than the main walking lane.

## Collision and validation

Visible replacements own only exact original house, bench, tree, railing and water rectangles. The old rectangles are replaced by the new walls, furniture, narrow fixture feet and an explicit union of deck footprints. Water outside the deck remains blocked. Collisions are never disabled globally. Source campaign maps are not mutated.

`qa/check-waterfront-layout.cjs` checks 2,344 positions at player radius 12 across broad promenade bands, the arrival deck, pier interiors and the new streets. The updated layout has zero fixed obstruction hits. It also checks NPC scenery safety, water/deck separation and matching native-map hashes. Ordinary keyboard input then walks the Bayview-to-Marina route, returns along all four pier centers, follows the shop access street, and enters/exits the relocated store with roof restoration and camera follow. Mobile pointer movement and desktop/portrait screenshots pass without browser exceptions.

Existing Marina, material, pier depth, scenery collision, roof depth, mobile control, running, campus, road topology and traffic regressions pass. Zombie startup, seeded map and connected-world exclusion match the earlier build. Original engine, Zombie stylesheet, Jay/NPC renderers, premium water/dock painter, precinct shell and interior bridge sources match `2db4c37` after Git line-ending normalization. Version numbers are unchanged.

Open the [local playable layout](http://127.0.0.1:8767/) and [before/after gallery with raw tests](http://127.0.0.1:8767/evidence/waterfront-layout/). The gallery contains desktop and portrait views, the relocated interior, clearance data and comparable performance samples. These use headless Chrome and emulated mobile dimensions; physical-device testing remains outstanding. No known fixed blockers remain on the tested walking bands. Nothing was pushed or published.

## Changed files

Runtime changes are in `v116-marina.js` (placements, owned geometry and boardwalk), `v115-world.js` (two connected frontage roads), and `v127-citywide-art.js` (respect ownership of replaced native decorations). `assets/marina-integration/gateway.png`, its manifest and contact sheet come from the supplied concept board. Existing assets and the current interior are reused.

The asset/build/review tools and relevant regression expectations are updated. `qa/check-waterfront-layout.cjs` and this directory preserve matching views, real movement results and clearance evidence. The earlier Marina report and evidence remain as the preceding revision.

## Reproduction

With the existing local build and server on port 8767:

```text
python tools/prepare_marina_assets.py
python tools/prepare_marina_integration.py
node qa/check-waterfront-layout.cjs
node qa/check-marina-isolation.cjs
```

For comparable performance, run `qa/measure-marina-performance.cjs` with `MARINA_BEFORE_PREVIEW=waterfront-layout-before` and `MARINA_PERF_OUTPUT=waterfront-layout-evidence/performance.json`. Then run `python tools/package_waterfront_layout.py` and `node qa/check-marina-review.cjs`. The before snapshot is preserved before source replacement in the build script.
