# Unit 9: 16-angle cruiser rendering

Completed locally on November 3, 2026. Baseline: `2e17267`.

The connected game now uses the 16-angle atlas by default. Actual keyboard driving demonstrated every pose clockwise, counterclockwise and in reverse, including the 337.5°/0° seam. The local inspector is at <http://127.0.0.1:8767/evidence/cruiser-turning/>; the game is at <http://127.0.0.1:8767/>.

## Artwork and initial inspection

The previous bridge selected eight distinct views at 45° intervals from `assets/police-driving/cruiser-16-source.png`. Physics already used a continuous heading and the camera did not rotate. Its coarse selection and inconsistent source padding made turning visibly step. The original source PNG remains byte-for-byte unchanged.

The new set retains seven source views and reconstructs nine views using that same navy/white patrol sedan as the reference, including corrected roof-lens handedness. Selected source images and exact image-generation prompts are archived beside the production assets and in `generation-prompts.json`. The built-in image generation tool created the reconstructed views; the Python packer only crops, uniformly downscales and aligns them. It does not rotate or mirror body pixels to manufacture the directions, and does not upscale them.

Production files are under `published-game-capture/assets/police-driving/turning/`:

- `cruiser-16-atlas.png`: 1024 × 1024 transparent RGBA, sixteen 256 × 256 cells.
- `frames/cruiser-00.png` through `cruiser-15.png`: individual transparent poses.
- `manifest.json`: angles, rectangles, common anchor [128,168], scale 0.5, vehicle ID, source provenance, hashes and per-pose roof-light hulls.
- `angle-reference.png`: labeled review sheet.

Angle 0 points east; positive angles run clockwise in the game's downward-positive Y coordinates. South is index 4, west index 8, north index 12. The existing 96 × 48 physical footprint is unchanged.

## Integration and reused systems

`cruiser-visuals.js` is a render-only adapter used by both the actual game and inspector. The existing bridge, depth queue, update loop, continuous car heading, canonical driving controller, entry/exit, collision response, save profiles and camera remain in use. There is no extra game simulation loop or replacement driving system.

Visual heading uses a 35 ms interpolation filter and 0.7° boundary tolerance. A bounded residual alignment of at most 2.2° supplements the genuine directional art. Each frame draws one opaque body: no silhouette crossfade, stretching or changing collision dimensions. A fixed-size soft shadow follows continuous physical heading independently of pose selection. Bounded suspension sway, skid and smoke effects provide cosmetic feedback during sharp/STOP turns without altering tire grip or drift physics.

Lights default off. Press **L** or the mobile **LIGHTS** button to cycle alternating, red, blue and off. Per-pose lens hulls keep the overlay attached to the roof. The selected mode persists with the existing vehicle profile, including when parked. Asset validation or `?cruiserLegacy=1` provides a reversible old-art fallback.

`prepare_civilian_preview.py` preloads the shared adapter in the connected build and extends the existing cruiser save validation with the optional light-mode enum. `precinct-cruiser.js` delegates rendering and exposes the existing input/save bridge. The canonical `game.js` remains unchanged.

## Verification results

| Check | Result |
|---|---|
| Sixteen unique frames, common anchors, transparency, no source upscale | Pass |
| CW/CCW/reverse selection, boundary jitter, final-to-first wrap | Pass |
| One body draw, fixed shadow, frozen physics object, bounded cosmetics | Pass |
| Four attached roof-light modes across all sixteen poses | Pass; attachment captures included |
| Invalid manifest and legacy fallback | Pass |
| Actual precinct forward, counterclockwise and reverse circles | All sixteen poses visited in each run, no contacts |
| Reverse parking | Final center (1760,1570.96), within marked stall; nose remains south while reversing north |
| Actual Downtown turn and Southbay Marina road drive | Pass, no contacts |
| Sharp STOP/turn cosmetic effects | Pass; effects bounded and expire |
| Entry, exit, reentry, mobile GAS/reverse/STOP/LIGHTS | Pass |
| Save/reload/import, per-profile isolation, no duplicate cruiser | Pass |
| Original controller at 30/60/120 Hz, braking/reverse/collision rebound | Pass |
| One-hour traffic separation simulation | 550800 body-pair checks, zero overlap |
| Pedestrian routes and campus keyboard/mobile/doors | Pass |
| Warm browser rendering | Both 60 fps; legacy P95 16.8 ms, premium P95 16.9 ms |

The browser driving tests use controlled starting fixtures to exercise regional turns reproducibly, followed by real keyboard inputs through the existing controller. They do not claim a single uninterrupted full-city tour. Mobile was verified in a 390 × 844 browser viewport; physical handset performance remains unmeasured.

Raw results: `gameplay.json`, `isolation.json`, `save-mobile.json`. Actual game captures include four angles, reverse parking, Downtown, Marina, handbrake cosmetics and mobile. The inspector supports clockwise/counterclockwise rotation, pause, individual frames, speed, zoom, light modes and anchor inspection.

The source audit compares canonical physics, campus/world/marina, civilian, character, wall-kit and Zombie sources against baseline. Entry/exit, collision and traffic-yield bridge functions are unchanged. Seeded Zombie map hash is unchanged, and starting Zombie requests zero cruiser visual assets. No Zombie code, controls, maps or settings were modified.

## Remaining visual limits

These are sixteen separately drawn raster views, not a mathematically exact 3D turntable. Minor silhouette/shading variation remains visible at extreme inspection zoom. Baked wheels remain attached; separate front-wheel steering was omitted to avoid wheel artifacts. Drift feedback is cosmetic and preserves the existing driving mechanics. No physical-phone benchmark was performed.

## Reproduction

Use the project's Python environment with Pillow, and Node with Playwright available. Run from the repository:

```text
python tools/build_cruiser_turning_atlas.py --approve
python tools/prepare_civilian_preview.py
node qa/check-cruiser-turning.cjs
node qa/check-cruiser-turning-preview.cjs
node qa/check-cruiser-turning-isolation.cjs
node qa/check-precinct-cruiser-safety.cjs
node qa/check-precinct-cruiser-controller.cjs
python tools/package_cruiser_turning.py
```

`--approve` records the completed local visual review in the manifest. All assets, tests, evidence and changes stay local. No push, deployment, remote merge, pull request or game-version increment was performed.
