# ROOKIE: Harbor City — V121 Art-Directed Southbay

**Real playable environment implementation** on \`feature/v121-marina-art-direction-pass\`, branching from verified V120. This is not a concept-art delivery.

## Why V121 exists

Inspecting the real V120 portrait and landscape gameplay evidence revealed that the bright repeated polygon caustics visually resemble cracked ice/glass more than deep marina water. The approved premium reference has fluid teal/navy masses, selective foam, bright sun glints, directional shadows and golden wood.

V121 replaces the visual MATERIALS, not the world camera or layout.

## Actual changes
- Nine separate 100% original, deterministic material PNGs in \`published-game-capture/assets/v121-marina/\` generated offline with \`tools/generate_v121_marina_art.py\`.
- \`water-body.png\` smooth periodic teal/navy water masses and sparse authored organic crescents.
- \`water-caustics.png\` low-opacity diffused irregular cellular light, no full-coverage high-contrast polygon mesh.
- \`water-glints.png\` four-frame sun sparkle atlas, camera-culled and anchored to world coordinates.
- \`water-reef.png\`, \`foam-frames.png\` maintain nearshore underwater character and native piling wake animation.
- \`dock-wood.png\`, \`dock-post.png\` warmer timber, directional edge highlights and rope/metal details.
- \`tree-shadows.png\` and \`seawall-light.png\` stronger foliage shade and golden-hour fixture light.
- The **same** \`v120-marina-art.js\` module is upgraded in place to load V121 atlases. Existing \`v116-marina.js\` still owns the ONLY connected marina drawing pipeline. No duplicate renderer or extra RAF.

## Existing systems preserved
- Exact three original piers, collision geometry, world map, camera and chunk cache.
- Existing storefront interiors, NPCs, missions, Jay shared character sprite and full interactive HUD.
- Saves and original game.js unchanged.
- Zombie Outbreak and all its assets / systems untouched.
- All changes isolated from the user's preferred build.

## Verification
- \`qa/check-v121-marina.cjs\` + V115/V116/V117/V118/V119 regression checks.
- \`tools/build_v121_preview.py\` packages an isolated full playable version.
- GitHub Pages comparison captures identical world camera, zoom and viewport before/after using \`qa/capture-v120-comparison.cjs\`.
- Deployment gates on a substantial measured image change plus functioning water asset decode and collision state.

## Next art tasks
The user-approved concept remains aspirational. Outstanding visual tasks include handcrafted/painted higher-resolution wave atlases, convincing boat/structure reflections, directional shadow occlusion, shadows under the player and more complete environment artwork. Browser-sized QA does not replace physical Android testing. Do not claim visual photomatch or 60 FPS.
