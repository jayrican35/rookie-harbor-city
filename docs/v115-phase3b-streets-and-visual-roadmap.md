# V115 Phase 3B — Professional road alignment and visual direction

## What has been changed (preview-only)
- Built a shared, **read-only** road-fabric module under `published-game-capture/v115-city-fabric.js`.
- Preserved stable district origins, player/vehicle future world IDs, mission positions, and all existing collision geometry: no disguised teleports or coordinate moves during this pass.
- Unified Harbor Avenue crossing visuals at Westfield ↔ Maple Court, Maple Court ↔ Precinct, Precinct ↔ Midtown, Midtown ↔ Downtown, Downtown ↔ Eastside, and Eastside ↔ Industrial. All six crossings are tied to the existing **world y=1721–1848** main-street band.
- Matched Northgate, Southbay, and Waterfront connector transitions to the same pavement treatment. These are graphical transitions only; underlying links remain the authored V115 streets.
- Added a subdued south and west coastal backdrop, an actual shoreline buffer, and lightweight green-belt textures that **render behind source district art**, instead of overriding buildings.
- Substituted compact, proportional region names at whole-city zoom to avoid Westfield/Maple, Midtown/Downtown, and Southbay/Waterfront label collisions.
- Reduced distant grass-detail rendering work at full-city zoom to protect mobile frame rate.
- Shared the exact coastal and crossing layer between the street-level connected world and the actual-world map. The illustrated concept art remains available via its original toggle.
- The original gameplay engine, mission logic, saves, academy modes, Zombie Outbreak, music, physics, and controls remain **byte-for-byte unchanged**.

## What this phase does NOT achieve
- Not the final 16-bit pixel-art city. Several original exterior maps still use provisional buildings, uneven sprite sheets, vacant green space, and temporary road graphics.
- Not a faithful 1:1 reconstruction of every artistic landmark in the original illustrated concept map. Geographic re-layout of the Waterfront and other districts requires reviewing existing quest and vehicle routes first.
- City traffic, quest interactions, cars, permanent seamless interiors (besides the precinct prototype), NPC schedules, and multiplayer server sync remain unfinished. The preview remains a separate exploration mode.
- Decorative streets and crossings are **not** collision boundaries or authoritative player/navigation data.

## When to upgrade the visuals
Do visual upgrades **in parallel with level construction**, not all at the end:

1. **Now — layout and navigation rules:** Lock consistent, actual road geometry, intersections, district adjacencies, camera behavior, park boundaries and the waterfront edge. Every city-scale change must have a matching actual-world map update and regression tests.
2. **Next — premium vertical slice:** Fully finish *Precinct 9 → Midtown* with coordinated 16-bit tilesets, detailed sidewalks, believable building scale/roofs, vehicle sprites, cutaway interiors, distinctive lighting, and responsive walk cycles. Approve this quality bar before reproducing it citywide.
3. **Then — expand district quality:** Reskin Maple Court, Downtown, Waterfront, Industrial, Southbay, Westfield, Northgate and Eastside from a shared palette and sprite-scale guide. Finish consistent NPC, traffic and furniture art while connecting remaining mission systems.
4. **After integration — production polish:** Camera LOD and chunk streaming, shadows, music, UI performance, accessibility, testing on Samsung mobile portrait and desktop. Avoid large visual effects that undermine frame rate or obscure obstacles.

### Quality gate for the next visual slice
- Streets, sidewalks, bike lanes, parking and entrances align across neighboring world chunks.
- The map shows exactly what the character traverses; no separate fantasy-map marker offsets.
- No district reloads or on-foot scene swaps.
- Stable world coordinates support future server-authoritative multiplayer, without turning it on prematurely.
- Each selected district and its building footprints use coherent pixel scale, lighting direction, and wall collisions.
- No changes to Zombie Outbreak under any circumstance without a new explicit user directive.

## Safety and release
Branch: `feature/v115-road-and-visual-grid` from `feature/v115-one-living-world`.
Do NOT merge to working GitHub Pages root.
Use separate `/preview/v115-roads/` link for A/B comparison.
Node syntax, V115 world/campus/connected city and road-fabric tests plus protected game-source hash comparisons must pass before preview publication.
