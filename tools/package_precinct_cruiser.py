from pathlib import Path
import shutil, json, hashlib, html, re
r=Path.cwd(); src=r/'cruiser-evidence'; dst=r/'docs/precinct-cruiser'; dst.mkdir(parents=True,exist_ok=True)
for name in ['01-approach.png','02-city-drive.png','03-parked.png','04-mobile-controls.png','trip.json','safety.json','05-sidewalk-drive.png','sidewalk.json','traffic.json']:
 shutil.copy2(src/name,dst/name)
trip=json.loads((dst/'trip.json').read_text()); safety=json.loads((dst/'safety.json').read_text())
report='''# Precinct 9 — dedicated drivable Unit 9

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

The complete round trip recorded **one collision response** during the automated maneuvering and completed successfully; this is not a claim of a contact-free trip. The canonical controller blocked the attempted move and rebounded. No collider was disabled to complete the trip. Raw final coordinates, collision counts and errors are in `trip.json`; mobile, profile, clearance, Zombie and protected-source results are in `safety.json`.

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
'''
n=trip['parked']['collisions']
contact=(f'The final full round trip recorded **{n} collision response'+('s' if n!=1 else '')+'** during automated maneuvering and completed successfully. The controller blocked contact rather than allowing body penetration. ' if n else 'The final full round trip recorded **zero collision responses**. Separate controller tests verified collision blocking and rebound. ')
report=re.sub(r'The complete round trip recorded.*?Raw final coordinates',contact+'Raw final coordinates',report,flags=re.S)
report=report.strip()+'\n'
(dst/'TEST_REPORT.md').write_text(report,encoding='utf-8')
pictures=''.join(f'<figure><figcaption>{label}</figcaption><img src="{name}" alt="{label}"></figure>' for name,label in [('01-approach.png','Walk from the entrance and approach Unit 9'),('02-city-drive.png','Drive through connected city streets'),('03-parked.png','Return, park and exit'),('04-mobile-controls.png','Mobile driving controls'),('05-sidewalk-drive.png','Drive across the clear Eastside sidewalk into paving')])
page='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Precinct 9 cruiser — local gameplay tests</title><style>body{background:#102238;color:#f9edd0;font:16px system-ui;margin:24px auto;max-width:1150px;padding:0 16px}a{color:#f4d276}img{max-width:100%;border:1px solid #8b9bac;border-radius:8px}figure{margin:26px 0}figcaption{margin-bottom:8px}pre{white-space:pre-wrap;background:#182e42;padding:20px;line-height:1.5}</style><h1>Precinct 9 · Unit 9 is ready to drive</h1><p>Clear sidewalks and paving are driveable. Traffic now follows with visible gaps.</p><p>Approach and use Drive / E. WASD steers and drives; Space stops. Stop fully and choose Exit / E to park.</p><p><a href="/">Play connected Harbor City</a> · <a href="TEST_REPORT.md">Completed test report</a> · <a href="trip.json">Round-trip results</a> · <a href="safety.json">Mobile, profiles and isolation checks</a></p>'''+pictures+'<h2>Test report</h2><pre>'+html.escape(report)+'</pre>'
(dst/'index.html').write_text(page,encoding='utf-8');shutil.copytree(dst,r/'site/evidence/precinct-cruiser',dirs_exist_ok=True)
print('Packaged cruiser screenshots, completed report and raw test results.')
