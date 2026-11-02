# V128 — World Quality and Grounded Running (isolated candidate)

## Why
A November 1 mobile Chrome recording shows a visible shrink when RUN is held. Away from the rich Southbay Marina, large grass expanses, simple building shells and unvaried masonry still reveal the connected-world prototype beneath the premium waterfront art. The objective is to improve the real continuous world rather than draw a detached map mockup.

## Root cause / fix
The cleaned V126 RUN sheet contains a painted sprite about 93px high, whereas the idle/walk cell has about 109px of actual artwork. Both previously mapped at 0.5 world units/pixel. RUN therefore *looked* smaller, even though the game camera, collision and destination cell stayed unchanged.

V128 renders **connected-city cleaned RUN frames only** at x1.18/y1.17 around the exact existing foot pivot. Feet remain at the same y coordinate on switching idle → run → idle, and the original campaign run atlas remains unscaled. No speed, collision, or control rewrite.

## Citywide graphics pass
- Reuses the existing V127 pixel atlas and single V115 Canvas renderer.
- Adds a world-seeded, zoom-gated, grass-only native-district microdetail layer; avoids asphalt/brick placements, does not spawn fake collidable trees or repeat across chunk seams.
- Adds mortar joints and wear to shared brick materials and drains/seams to promenade surfaces instead of monolithic color bands.
- Gives existing **building footprints** district-sensitive roof palettes and façades (residential shutters, roof vents, commercial awnings) without moving doors, collisions or retained Midtown image assets.
- Keeps the approved Southbay Marina center as a **visual comparison baseline**, not an area to repaint.
- Does not add maps, scenes, duplicate animation frames, saves, RAF loops, or external dependencies.

## Invariants / tests
- Main production game.js unchanged.
- Zombie Outbreak: no source, map, sound, input, control, settings, balance or asset changes.
- Existing V115 world coordinates, HUD, mobile joystick, road physics, roof fade and marina interactions unchanged.
- Existing V127 regression and new `node qa/check-v128-quality.cjs` must pass; new checks verify equal drawn silhouette height and planted feet.
- V128 build uses existing proven preview builders in `tools/build_v128_preview.py`.

## Important reality check
This is a **substantive quality pass**, not a claim the entire city now meets Marina quality. The video still calls for genuinely authored per-district sprites and tiles, coherent house/retail/industrial sets, physically believable dressing, occlusion, NPC behavior, interior integration and direct Android FPS tests. These are future release gates, not boxes checked by small procedural details. Validate on a phone and inspect all ten V127 screenshot positions against the reference Marina before promoting.
