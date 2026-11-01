# ROOKIE: Harbor City — V127 Citywide Visual Continuity

## Objective
Extend the approved Southbay Marina visual language across the existing connected harbor-main world (x=-3100 to 9656, y=0 to 4680). Preserve native camera, map positions, collision, interiors, original campaign and V125 mobile controls. No replacement scene or renderer.

## Nine existing connected districts
Westfield, Residential, Midtown, Downtown, Eastside, Industrial, Northgate, Southbay and Waterfront. One reusable 32px premium marina-derived material palette for native ground rectangles, roads, brick promenades, grass, and coastline. Camera-culled 256px material chunks (bounded cache maximum 112); world-seeded pixel texture; no drifting seams.

## Existing scene art and architecture
Reuse current original building sprites first, and only replace old solid-color fallback rectangles with detailed roof tiles, fascia, walls, windows and doors inside their unchanged footprints. Reuse existing exterior tree, palm, lamp, bench, planter, fountain and mailbox images in the same existing NPC/player y-sorted render queue. No second scene, physics engine or parallel loop.

## Waterfront continuity
Existing native promenade extends into neighboring neighborhoods at y=3650–3784. Shore water grades into adjoining coast rather than a rectangular cutoff, with corresponding water physics in the existing collision method. Original pier 18 pilings, V126 dry boards, boats, waterfront interiors and water art remain native and unchanged. Preserve original pedestrian crossing corridors.

## One citywide HUD
Remove the marina-only HUD hiding condition. Existing profile, menu, Case, Map, Gear and Team remain persistent. Region label changes with world position. Outside Marina, existing minimap canvas draws local surrounding roads with a central player marker; inside, retain authored marina map. Do not create a second minimap UI.

## Changed files
- published-game-capture/v127-citywide-art.js: world materials, shoreline, walkways, depth-sorted original exterior sprites, fallback building art, citywide map.
- published-game-capture/v115-campus.js: small hooks into existing renderer, original road graph, shared actor sorting and coast collider.
- published-game-capture/v116-marina-hud.js: persistent HUD and location-aware map.
- tools/build_v127_preview.py: isolated playable preview derived from V126.
- qa/check-v127-citywide.cjs, qa/capture-v127-citywide.cjs: deterministic and actual mobile-browser world tests.
- .github/workflows/v127-citywide-qa.yml: existing gameplay regressions and byte-level mode protection.

## Absolute protection
No edits to game.js, outbreak.css, controls.css, V116 marina gameplay, V117 Jay animations, V126 boards, V125 HUD CSS, existing artwork, original vehicle controls, missions or save files. Zombie Outbreak unchanged. No automatic merge into the approved playable root.

## Limitations
V127 is a consistent world-scale material and continuity foundation, not a claim that each street and interior has received bespoke new paintings or quests. Neighborhood art direction, handcrafted points of interest, diverse ambient NPC behaviors, and device-specific performance are separate follow-on milestones. HTML Canvas QA is mobile-sized Chromium, not a physical Android/iPhone benchmark.