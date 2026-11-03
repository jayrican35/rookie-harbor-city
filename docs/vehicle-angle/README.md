# Stronger 3/4 vehicle angle — connected preview

The owner clarified that the connected preview's new cars were visible but the perspective was still too shallow. This pass replaces that artwork with a more elevated 3/4 view. It does not change the original campaign's separate vehicle painters.

Open http://127.0.0.1:8767/ or http://127.0.0.1:8767/vehicle-review/. The review now starts on the street outside Precinct 9, with **Raised 3/4**, **Previous shallow angle** (`a547e57`) and **Original overhead** (`be45a62`) comparisons. The locker/interior review remains at http://127.0.0.1:8767/interior-review/.

## Art and integration

Built-in imagegen edited the previous source sheet, retaining the police cruiser, civilian sedan and white delivery van identities, four cardinal directions, colors and livery. Camera elevation within the artwork is increased to roughly 50–55 degrees, showing broader roof, hood and trunk planes while retaining body sides and tires. No diagonal road headings or world rotation were introduced. North is a real rear view, south a real front view; no front frame is rotated to fill missing directions.

Saved source: `published-game-capture/assets/perspective-pilot/vehicles-source-raised.png`. The previous `vehicles-source.png` is preserved. [Final imagegen prompt](asset-prompt.txt). `tools/prepare_perspective_assets.py` packs the new source into the same 512×512 atlas with 52 directional/paint frames, isolating each body with the existing component crop process.

The existing vehicle painter's visual height allowance now accommodates the broader top planes without squashing them or shrinking the horizontal bodies. At 1.0× the east-facing cruiser is 86×60 instead of 86×50 pixels, sedan 86×55 instead of 86×47, and van 104×70 instead of its previously height-limited 97×56. Contact anchors and ground shadows retain the same world coordinates. Collision, traffic paths/speed/yielding, camera, world projection and input are unchanged. Existing buildings, walls, furniture and NPCs are untouched.

## Verification

- Actual running-game before/after captures at matching camera coordinates, at both 1.0× gameplay zoom and 1.3× detail zoom, on 1280×720 and 390×844.
- All three families × four direction frames draw successfully, with uniform aspect-preserving scaling and no rotation. Each horizontal silhouette has increased visible depth.
- Camera, player/world snapshot, station geometry and road graph match the previous build exactly. Traffic/road and guarded-atlas regression checks pass.
- No browser exceptions. The patrol capture waits for the real police car to arrive naturally and enter the visible street; traffic positions are not staged.
- Fresh Zombie startup and seeded map match before/after. Vehicle art stays inactive and unloaded, with zero vehicle-atlas requests in Zombie. Original engine, movement/world, Jay, Marina, city art, precinct bridge and façade bytes match baseline hashes.
- The new street review switches correctly between raised, shallow and original overhead views.

Settled paint p95: desktop **5.5 → 4.9 ms**, mobile emulation **4.3 → 4.1 ms**. These are 180-frame paint windows after settling, not physical-device FPS certification. [Actual evidence and full results](evidence/index.html). Generated source art is not presented as gameplay evidence.

## Files

Runtime: `published-game-capture/v135-precinct-wallkit-test.js` (visual height allowance only); vehicle atlas/manifest and new raised source image.

Support: `tools/prepare_perspective_assets.py`, `tools/prepare_vehicle_angle_review.py`, `tools/vehicle_review.html`, `tools/package_vehicle_angle_evidence.py`, `qa/check-vehicle-angle.cjs`, `.gitignore`, prompt and this evidence/report.

Reproduce with the vehicle asset preparer, vehicle-angle review builder, QA script and evidence packager. All changes remain local. No publication, deployment, remote edit or game-version change occurred.
