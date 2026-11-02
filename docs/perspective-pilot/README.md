# Precinct 9 perspective pilot — local review

The local pilot is ready at http://127.0.0.1:8767/. Use **3/4 pilot** and **Before** to compare. The [evidence gallery](http://127.0.0.1:8767/evidence/perspective-pilot/) contains actual matching-camera captures and a gameplay recording. Stop here for owner visual approval; no citywide rollout is included.

## Audit and implementation

The current camera already supports the requested fixed 3/4 JRPG presentation through translation and zoom. World coordinates remain an orthogonal grid. Jay's canonical renderer already provides full-body four-direction walking/running, alternating limbs and foot anchors. Precinct architecture, roof depth, Community Walk trees, raised borders, benches, lamps and sidewalks already provide compatible dimensional art. Existing actors, cars, props and building shells share a feet-Y depth queue. These systems and approved artwork were retained.

The visual mismatch was the connected preview's rectangular overhead traffic. A bounded adapter in its existing vehicle draw function selects genuine east/west/front/rear sprites, uses uniform aspect-preserving scaling and anchors the body above the existing footprint. Scope is x=387–2310, y=1124–1848, enabled only by the local pilot page while the connected world is open. Other districts retain their baseline vehicle renderer. Existing movement, traffic paths, yielding, collision geometry, camera and game version identifiers are unchanged. Existing Community Walk prop feet supply small contact shadows. No new animation loop, controller, projection or world renderer was added.

Only missing vehicle views were generated with built-in imagegen, using the owner's supplied vehicle atlas as an identity/style reference. The pilot includes police cruiser, civilian sedan and delivery van: 12 directional views, plus six retained sedan paint variants (36 atlas frames total). The generated delivery-van interpretation requires owner approval. Native 64-pixel frames are cropped into a 512-pixel atlas; anchors and dimensions are recorded in its manifest. [Final generation prompt](asset-prompt.txt). Source image: `published-game-capture/assets/perspective-pilot/vehicles-source.png`; prepared atlas/manifest are beside it. Existing character and environment art were reused.

An interrupted overhead-vehicle experiment is preserved, inactive, under `docs/audit/vehicle-experiment/`; it is not loaded by the pilot. The comparison is the exact last committed implementation, **be45a62**, rather than that unfinished experiment.

## Validation

`qa/capture-perspective-pilot.cjs` passed for both builds at 390×844 and 1280×720. `qa/check-perspective-depth.cjs` passed supplemental checks. Full machine-readable results are in [evidence/results.json](evidence/results.json), [supplement.json](evidence/supplement.json) and [source-protection.json](evidence/source-protection.json).

- Geometry, road links, entrance definitions, player identity and five approach/promenade collision samples match the baseline exactly. Road/traffic/V133/V134 source checks also pass.
- Real keyboard input verifies all four walking directions, animation phase advancement, running and camera follow. Actual touch events move Jay 65+ world units using the existing mobile joystick.
- Starting from the doorway approach, real key input enters the lobby, exits across the plaza, travels through the parking aisle and enters/exits the garage. Lobby roof alpha reaches 0.04. QA uses explicit initial placements for independent scenarios; no game transition was replaced with placement or teleportation.
- Instrumented actual Canvas draws verify Jay behind/in front of the same tree and behind/in front of the existing façade at their respective feet depths. Matching screenshots document both tree cases and the existing roof cutaway.
- Sedan and van sprites appear in the recorded live traffic; an additional actual gameplay capture shows the patrol car after natural arrival. All three families × four directions draw successfully in a separate diagnostic Canvas. The current pilot artery exercises east/west travel; north/south turning occurs outside its bounds and is not certified in live pilot gameplay.
- No browser exceptions or new pilot asset failures. Five inherited missing assets remain: parking_bay.webp, wheel_stop.webp and three civilian portraits/sprites. They are listed in results, not introduced by this pass.

| Viewport | Before paint p95 | Pilot paint p95 | Before max | Pilot max |
|---|---:|---:|---:|---:|
| Mobile emulation 390×844 | 3.6 ms | 3.5 ms | 7.4 ms | 8.3 ms |
| Desktop 1280×720 | 5.5 ms | 6.1 ms | 11.2 ms | 12.6 ms |

These are one local headless-Chrome run's Canvas paint timings, not total frame times or physical-phone certification. Mobile input, layout and rendering were tested by emulation; actual Android/iOS testing remains outstanding.

Zombie Outbreak source/assets/settings were not changed. Original `game.js`, `outbreak.css`, canonical Jay, world graph, Marina and city-art modules match baseline hashes. Separate fresh-page tests verify seeded Zombie map parity, startup, weapon equip, refusal to enter the connected pilot and no pilot atlas loading. This bounded smoke test does not certify a full Zombie playthrough.

## Changed files

Runtime changes:
- `published-game-capture/v115-campus.js`: bounded vehicle delegation and lazy asset preparation.
- `published-game-capture/v135-precinct-wallkit-test.js`: pilot atlas loader, direction selection, anchor/scale and diagnostics.
- `published-game-capture/v134-precinct-reference.js`: bounded contact shadows at existing prop feet.
- `published-game-capture/assets/perspective-pilot/`: source, atlas and manifest.

Build/QA/support:
- `tools/prepare_perspective_assets.py`, `tools/prepare_perspective_pilot.py`, `tools/package_perspective_evidence.py`.
- `qa/capture-perspective-pilot.cjs`, `qa/check-perspective-depth.cjs`, `qa/check-world-traffic.cjs`.
- `.gitignore`, this report, prompt and evidence; archived inactive vehicle experiment and owner vehicle reference.

`site/` is a reproducible ignored local build. Rebuild with `tools/prepare_perspective_pilot.py`; run capture, supplemental checks and packaging with the bundled Python/Node runtimes. Existing server serves `site/` on port 8767. Nothing was pushed, published, deployed or assigned a new game version.

## Expansion blockers

Owner visual approval is required before expansion. Review vehicle size, pixel density, directions and delivery-van interpretation first. The existing connected world remains a walkable preview; campaign missions and player driving have not been migrated into it, so this pilot does not certify campaign completion or drivable-car integration. Other districts and all vehicle families require scoped asset audits and physical-mobile validation. Their geography and existing artwork remain unchanged.
