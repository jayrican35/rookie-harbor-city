# Precinct 9 — Phase 2: Windows and Facade Integration

Scope: Phase 2 windows only. Do not advance to entrances, doors, signs, awnings or NPC changes.

## Audit
- Existing Phase-1 26 transparent PNGs and 1024x1024 atlas in assets/precinct9-wall-kit-phase1. All original frames are retained without changing their source rectangles.
- Native Canvas game, original camera and collisions: v115-campus.js.
- Existing cached reference facade and windowPane: v134-precinct-reference.js.
- Existing single manifest/image loader: v135-precinct-wallkit-test.js. No new renderer or lighting engine.

## New window production assets
Run tools/build_precinct9_windows_phase2.py PHASE1_DIR PHASE2_DIR.
Output: published-game-capture/assets/precinct9-windows-phase2/ — 16 named transparent PNGs, 1024x1024 combined original Phase-1 + Phase-2 atlas, manifest.json with 40 source frames.

Assets: single warm/dark/blind/shuttered, double warm/dark/mixed, triple warm/mixed, stone frame, blind overlay, lintel, sill and connector.

Blue brick, ivory limestone, navy frames and restrained amber illumination reflect the supplied reference sheet. No imported background artifacts or scene-sized images.

## Integration
The same V135 atlas loader reads the Phase-2 manifest in the V136 preview. Existing V134 windowPane calls delegate directly to the asset atlas. Its cached main and garage facades are invalidated only once after the window atlas loads. No floating duplicate windows; no separate image manager. Original architecture positions, room/roof transparency, door thresholds, player and NPC depth ordering, camera and city map remain authoritative.

Native 1:1 pixel resolution, 32-pixel art grid; 64x96 physical window module is centered in each existing V134 window bay. Lit/unlit pattern deterministic. This does not alter the actual game's lighting engine.

## Validation
Real 390x844 Android browser before/after screenshot comparisons in the original connected Harbor City Canvas. QA checks window atlas load, frame count, lit/unlit difference, one-time facade cache refresh, walkable doors, colliders, road and Marina unchanged. Automated tests are not user visual approval.

No main campaign files, Zombie Outbreak, Academy, NPC mechanics, Marina, roads, saved profiles or Phase-1 PNGs modified. Do not merge until visually approved.
