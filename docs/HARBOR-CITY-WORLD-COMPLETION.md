# ROOKIE: Harbor City — World Completion Milestone

**Authoritative visual benchmark:** approved Southbay Marina.
**Single development integration branch:** `feature/v128-citywide-quality-run-scale`.
**Pull request:** #11 (draft; no production merge until accepted).
**Production:** original GitHub Pages root and separately hosted preferred build remain untouched.
**Absolute exclusion:** Zombie Outbreak maps, mechanics, controls, AI, lighting, sound, assets, tuning and saves.

## Real changes in this integration branch

1. **Jay's RUN-scale regression fixed.** The connected-city cleaned running atlas now matches walking silhouette height at the existing foot anchor. Original campaign sheet, walk speed, run speed, camera, and collision unchanged.
2. **Unified citywide art renderer extended:** shared original marina atlas and authentic exterior sprites, chunk-cached materials, coherent brick joint/sidewalk/drainage details, natural grass wear, sunlight accents.
3. **Eight non-Marina district identity treatments:** Westfield, Residential, Midtown, Downtown, Eastside, Industrial, Northgate and Southbay each have restrained ground-level flora, weathering, material accents and context-specific building thresholds.
4. **Buildings retain real geometry:** district-appropriate door approaches, façades, awnings, shutters, roof equipment, industrial loading doors, porch details and trims. Recovered original storefront sprites still take precedence over procedural fallback.
5. **New greenery is physical:** deterministic, limited groves use the already-loaded tree/palm sprites, native actor depth sorting and small trunk colliders. The placement plan excludes mapped roads, solids, doors, existing scene objects and nearby interactions. No extra game loop, scene or save writes.
6. **Protected Marina:** latest authored Marina assets, interiors, water, piers, NPCs and roof transitions still own the entire original waterfront section. New district dressing and generated groves explicitly skip it.
7. **Living-city pedestrians in the existing engine:** up to two wandering pedestrians in each non-Marina district, using the original V123 animated NPC atlases, safe 95-unit routes, native movement collision and the existing Talk prompt. No separate animation loop, vehicle AI, save writes or mission progress.
8. **Mobile collision and draw optimization:** a 192-unit district-local spatial index is shared by generated-tree trunk checks and viewport prop culling. Tree positions stay identical; only the cost of finding them changes.
9. **No disconnected road stubs:** six new canonical connector segments bridge the missing precinct Harbor Avenue gap, carry the main artery across the eastern boroughs, finish the Southbay loop at the existing Marina edge, and connect Midtown and Northgate north-south avenues. Three new crossing markers sit on that actual asphalt. A graph test proves all 14 canonical street segments connect, with **no new street overlapping Southbay Marina**. The original local district road tiles are still authoritative.
10. **Living street traffic pilot:** eighteen bounded marked/unmarked civilian, delivery and police patrol vehicles move along two real Harbor Avenue lanes, yield when Jay approaches, block the player's normal movement at their physical body, and share the single native depth queue and clock. This is not yet a complete traffic-signal, pursuit, AI-driver or driveable-player-car system.
11. **Release verification:** new `qa/check-world-completion.cjs` plus existing RUN, world, Marina depth, HUD and source-asset regressions. Browser CI produces ten geographic comparisons plus idle/running screenshots in a separate preview.

## Release gate (do not claim complete until all pass)

- Real browser: walkthrough screens at each of the ten reference positions, including west/east Southbay seams and native Marina baseline, **plus three new roadway-junction captures**.
- Same zoom/position comparisons show a **material positive visual change** in each outlying district; Marina stays visually consistent.
- Player RUN/idle should preserve visible size, foot position, sprite identity and contact shadows for all facings; no small character when running.
- Pass native Android portrait and landscape joystick+RUN multitouch, menu/map switching, save/profile separation and collision testing.
- Navigate from Precinct 9 through Midtown, Downtown, Industrial, Residential and Marina with no map switching/camera jump.
- Check each added grove has correct player-behind/player-in-front occlusion and walkable bypass, and no hidden blockers over roads, doors, mission markers or shore.
- Verify 90th/95th-percentile frame paint time and memory cache on **physical phones**; emulated Chromium is not proof of device FPS.
- Original campaign / Academy / Zombie source and visual behavior byte-for-byte or mode-isolation verified; no production merge without acceptance.

## Still unfinished (not hidden by the milestone)

- True comprehensive, hand-authored premium pixel art for *every* block and building has not been created. The generic fallback renderer is still used in places lacking source artwork.
- Most extra connected-city building interiors are not yet seamlessly reconstructed. The classic main-campaign missions, driving AI and all traffic systems remain partially separate from the continuous-world exploration view.
- The first bounded pedestrian routines are live in eight districts; full schedules, varied authentic city NPC art, traffic coordination and quest-aware behavior are still unfinished.
- The 14 canonical connector rectangles now form one verified road graph; **individual local side streets** still need a complete dead-end audit against the actual browser map and physical collision, including roads that end at authored buildings.
- Physical Android FPS, long-session soak tests, complete save upgrade/migration and true multiplayer transport are unverified/not implemented.

**Approach:** One cohesive World Completion objective and one review, not a promise that each interim code commit constitutes a finished game. Keep adding/validating within this milestone until the acceptance gate is honestly met; preserve the original preferred playable version.
