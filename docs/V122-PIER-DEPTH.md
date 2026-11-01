# ROOKIE: Harbor City — V122 Pier Depth and Structural Read

Implementation on isolated branch feature/v122-pier-depth-structural-fix, based on V121. Not merged into approved playable root.

## Root cause
- All 18 timber piling sprites were painted in the scenery pass BEFORE Jay and marina NPCs, producing incorrect visual overlap.
- Foam was drawn AFTER dock planks, so water-contact pixels covered the dry top surface.
- V121 dock atlas is 90x192 pixels, but dock() was slicing in hardcoded 128px intervals. Missing end-cap face and wide dark side bands also weakened deck elevation.

## Implemented
1. V116 marina now exposes pierOccluders(view) and drawPierPost(g,post). Each of the original 18 posts retains the original world location: x at 4655, 5105 or 5555 plus edge offsets 3 or 86; y at 3820, 3945 or 4090.
2. V115 campus adds piling entries into the existing sorted entity draw queue, keyed by base y = py+31. Jay and NPCs now render behind or ahead of the post according to their foot position; no new scene system.
3. Water-contact foam is painted BELOW the deck top, while sprites and post caps draw at their correct y depth.
4. Existing V120/V121 art module draws 90x300 solid pier using atlas source intrinsic 192px height (192+108 rows), properly clips all wood to deck top, paints narrow outside-only underwater side shadows, and adds a physical wooden end-cap face below the waterline.
5. The V121 water and lighting remain, with original actor, HUD, interaction, interior and game-state logic preserved.

## Automated verification
- qa/check-v122-pier.cjs validates source pass order, real queue insertion, atlas crop heights, balanced canvas, end-cap/side shadow geometry and protected state.
- qa/capture-v122-pier.cjs captures actual game Canvas at x=5119,y=3834 (behind piling) and x=5119,y=3882 (in front), both with matching camera and native collision checks.
- Existing V115/V116/V117/V118/V119/V121 regression tests are retained.
- tools/build_v122_preview.py generates a separate playable URL from V121.

## Absolute protection
No updates to original game.js or outbreak.css, Zombie Outbreak systems/assets/maps/settings, original character sprites, camera, collision, map, saves, music or gameplay physics. Nothing merged into original production root.

## Acceptance and limitations
Visual comparisons must show the post covering Jay when he is behind its anchored base, and Jay covering the post when he stands in front. Dock planks must always appear dry and above water disturbances, with side shadows strictly outside the 90px walkable surface. Further artwork modernization may still be appropriate, but V122 focuses on these user-reported structural defects.