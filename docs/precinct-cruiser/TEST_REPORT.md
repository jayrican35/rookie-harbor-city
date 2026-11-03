# Precinct 9 — dedicated drivable Unit 9

Completed locally on November 3, 2026. One persistent cruiser starts in an existing marked stall at **(1760, 1568), facing south**, between x=1725–1795 parking lines. Its original 96×48 driving footprint fits the 109-unit stall. The only collision-geometry change retires 11 unpainted legacy fence lines in connected-map copies. Building footprints, streets, parking layouts, visible fences and waterfront barriers remain authoritative.

## Controls and behavior

Approach the cruiser and use the cartoon **Drive** prompt with **E** or the existing Action button. Entry starts the engine. Use **W/Up** to accelerate, **S/Down** to brake and reverse, **A/D or Left/Right** to steer, and **Space** to stop. Touch controls provide steering, Gas, Brake/Reverse and a separate STOP button. At a full stop, **E / Exit** chooses a collision-free place to stand, switches off the engine and leaves Unit 9 where it was parked. A moving exit is refused.

The default local review now starts at the precinct entrance, with a following camera. The cruiser is in the lot to the east. After use, its saved location takes precedence over that default stall, including when the precinct is left and revisited.

## Reused systems and artwork

- Existing local `assets/police-driving/cruiser-16-source.png` supplies eight genuine cardinal/diagonal camera views. No new vehicle image was generated and other vehicles' artwork is unchanged. The sprite body is never rotated in screen space. Its shadow uses the original physical footprint.
- The builder copies the original `game.js` controller from `var carReboundTime=0` through `updateCar` **verbatim**, then binds it to connected-world collision, save and input dependencies. Acceleration, coasting, braking, reverse steering, speed limits and collision rebound stay canonical. The existing campus clock advances it with bounded substeps; there is no second simulation loop.
- Unit 9 joins the existing actor/building depth queue. The same smooth world camera follows the vehicle. The existing interaction button and keyboard action are reused; touch driving controls use release/cancel-safe pointer holds.
- The parked vehicle blocks walking. Its full footprint checks existing walls, props, water, traffic and civilian feet. Traffic yielding distinguishes a driver from a pedestrian, so a following cruiser does not freeze cars ahead or cars in the other lane.
- Parking is an optional `connectedCruiser` field in the active player save. A narrow compiled-preview importer extension validates and retains that field before startup autosaves. It stores one stable vehicle ID, coordinates and heading; speed and engine state reset safely on reload. Jay and Rosa have independent records. The legacy campaign car/player coordinates and mission state are not repurposed.
- Existing preview save isolation remains in place. No unprefixed production save keys were written. Original `game.js`, `outbreak.css`, world topology, marina and Jay sources match baseline `be605d4` after line-ending normalization. Zombie refuses connected-world entry and requests no cruiser artwork.

## Sidewalk access and overlapping traffic

Unit 9 can drive across clear sidewalks, paving and grass. There is no road-material restriction. Eleven exact six-unit legacy fence-line colliders in Westfield and Eastside had no connected-world painter and blocked visibly open ground. Their connected copies are retired; the original campaign maps remain untouched. Buildings, visible thin posts, trees, people, other vehicles and water stay solid. Thin-post vehicle shapes reuse the original map solids instead of making the pavement solid.

Ambient traffic now follows the next car on the same closed route with a minimum 142-unit path gap. Faster cars queue behind slower or stopped cars. Wraparound uses the same spacing rule. A saved cruiser reserves its physical footprint when traffic first spawns, and perpendicular parking is included in yielding. A one-hour simulation plus a stopped queue checked 550,800 pairs of actual traffic body rectangles and found zero overlaps; see `traffic.json`.

Actual keyboard driving crossed the Eastside road edge and sidewalk into the paved courtyard. Clear grass was accepted, while a building and marina water were rejected. No collision gate was disabled for the test; raw contacts and retired barrier coordinates are in `sidewalk.json`.

## Completed tests

| Check | Result |
|---|---|
| Walk from precinct entrance to parking space | PASS — actual keyboard walking |
| Approach prompt and E entry | PASS |
| Leave stall through aisle and real driveway | PASS — actual driving, no teleport |
| Travel onto Harbor Avenue and across the Midtown seam | PASS |
| Return to Precinct 9 and park inside the original stall | PASS |
| Exit, reenter, exit again | PASS |
| Reload preserves exact last parking coordinates and heading | PASS |
| Save import and independent Jay/Rosa profiles | PASS |
| Touch Gas, Brake/Reverse, STOP, Exit | PASS — 390×844 emulated mobile |
| Exit while moving | PASS — refused |
| Lot/aisle/driveway clearance and solid-wall rejection | PASS |
| Canonical collision/rebound, STOP, reverse steering | PASS — 30/60/120 Hz |
| Existing pedestrian, traffic, civilian-art and precinct tests | PASS |
| Actual Eastside sidewalk/courtyard driving, clear grass, building/water guards | PASS |
| One-hour traffic following, stopped queue and saved-cruiser spawn reservation | PASS — zero body overlaps |
| Zombie exclusion, protected sources, preview-only storage | PASS |

The final full round trip recorded **1 collision response** during automated maneuvering and completed successfully. The controller blocked contact rather than allowing body penetration. Raw final coordinates, collision counts and errors are in `trip.json`; mobile, profile, clearance, Zombie and protected-source results are in `safety.json`.

All browser runs reported zero JavaScript errors. Desktop and mobile layouts were reviewed from real gameplay captures. Physical-phone testing remains outstanding; mobile checks use headless Chrome with touch emulation. Everything remains local. No push, deployment or game-version increment occurred.

## Reproduce

```text
python tools/prepare_civilian_preview.py
node qa/check-precinct-cruiser-controller.cjs
node qa/check-precinct-cruiser-trip.cjs
node qa/check-precinct-cruiser-safety.cjs
node qa/check-v115-campus.cjs
node qa/check-world-traffic.cjs
node qa/check-cruiser-sidewalks.cjs
node qa/check-world-pedestrians.cjs
node qa/check-civilian-adapter.cjs
python tools/package_precinct_cruiser.py
```

Playwright uses the bundled Node dependencies through NODE_PATH and local server http://127.0.0.1:8767/. Browser tests use fresh isolated contexts; they do not drive or reset the user's live save.
