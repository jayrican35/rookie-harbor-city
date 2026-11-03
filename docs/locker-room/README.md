# Locker room furniture and details — local review

Open http://127.0.0.1:8767/. The review now starts in the locker room; **Updated locker room / Before** compares against completed-wall commit `7cbd1ea`. [Actual desktop/mobile comparisons](http://127.0.0.1:8767/evidence/locker-room/).

## Changes

The three existing banks now use the blue-gray locker art from the supplied precinct interior pack. The middle bank includes an open compartment with a hanging uniform. Jay's numbered Locker 7 plaque remains attached to the first bank, aligned with the existing interaction point. Three changing benches use the matching pack artwork; folded towels and a bag sit on two existing seats.

Only the six existing furniture records receive this visual treatment. Their positions, collision footprints and feet-depth entries are unchanged. Accessories are part of the bench drawing, not new floor obstacles. The open compartment is a visual variant; no door controller or inventory behavior was added.

Five prepared sprite modules occupy unused space in the existing 512×256 interior atlas. The original ten wall modules are pixel-identical to the completed wall pass. The source pack is reused without new image generation, dependencies, asset loaders, renderers or simulation loops. The existing precinct bridge selects the furniture crops only while the connected interior is active. Other furniture and NPCs are unchanged.

## Verification

- Before/after room, wall, furniture, NPC and Locker 7 interaction data match exactly. A 741-point collision grid matches at 1280×720 and 390×844.
- Real input walks the central aisle to Locker 7. Its existing Inspect prompt remains reachable and returns the same label; direct storage snapshots remain unchanged.
- Actual Canvas ordering verifies Jay behind and in front of the new locker sprite. Matching screenshots document both positions.
- Every previous wall frame is pixel-identical to baseline. Wall-union/doorway, legacy furniture, road, traffic and canonical character regression checks pass.
- No browser exceptions or new atlas failures. The five inherited missing parking/civilian assets remain outside this task.
- Zombie startup and seeded-map parity pass with zero interior-atlas requests. Connected mode is refused in Zombie, and its wall/furniture guard is inactive. Original engine, controls, world, Jay, Marina and wall-loader files match baseline hashes. Full Zombie playthrough was not repeated.
- The local review defaults to the locker room and switches before/after correctly.

| Viewport | Before paint p95 | Updated paint p95 | Before max | Updated max |
|---|---:|---:|---:|---:|
| 1280×720 | 5.4 ms | 5.4 ms | 7.0 ms | 5.9 ms |
| 390×844 | 2.8 ms | 2.4 ms | 3.1 ms | 3.0 ms |

These are settled 180-frame Canvas paint windows in headless Chrome, not complete frame times or physical-device FPS. [Results and source hashes](evidence/index.html) include the actual captures.

## Files and reproduction

- `published-game-capture/v131-precinct-legacy-bridge.js`: selects locker/bench crops within the existing painter and guards.
- `published-game-capture/assets/precinct-interior-walls/manifest.json` and `walls-atlas.png`: five furniture frames added in unused space.
- `tools/prepare_interior_wall_assets.py`: source crops, background cutouts and open-compartment composition.
- `tools/prepare_locker_room_review.py`, `tools/package_locker_room_evidence.py`: local comparison and evidence.
- `qa/check-locker-room.cjs`, `qa/check-locker-scope.cjs`, `.gitignore` and this report/evidence.

Run the asset preparer, then `tools/prepare_locker_room_review.py`. Run both locker QA scripts and the packager. The review builder uses the existing interior build, creating it if absent.

The connected preview's Locker 7 action remains its existing inspection behavior; the classic game's equipment workflow was not migrated or modified. NPC presentation remains a separate task. No push, deployment, online edit or version-number change occurred.
