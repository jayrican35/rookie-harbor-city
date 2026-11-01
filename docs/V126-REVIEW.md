# ROOKIE: Harbor City — V126 Dock & Running Quality Pass

## User-recorded evidence
Reviewed November 1 2026 Android Chrome recording (25.22 s, 1080 × 2340) showing marina promenade, waterfront piers and running Jay. It shows persistent gold player ring, visibly repeated wood planks and fast/jittery leg movement.

## Root causes
- Connected-city drawOfficer() painted a bright selection ring underneath Jay in THREE pathways (approved sprite, marina fallback, generic fallback). The player still has a natural tiny contact shadow.
- The dock painter loaded the older 90×192 V121 texture and repeated it to cover a native 90×300 pier, resulting in an obvious seam and short, similar board motifs.
- The Jay run atlas uses eight authentic frames per direction but the connected animation advanced about 14.8 frames/s at full speed, with a highly oscillatory V119 bob at ~13Hz and overly bright tiny footstep streaks. The atlas contains stray detached lines/artifacts outside the character silhouette.

## Actual implementation
1. published-game-capture/v115-campus.js: remove only gold-ring strokes in all player paths; no changes to the camera, collision, controls, world or character sprites.
2. tools/generate_v126_dock.py builds a NEW full 90×320 native atlas: varied individually shaded planks, grains, knots, worn joints, physically darker seams, paired fasteners and raised edge bevels. published-game-capture/v120-marina-art.js loads the V126 art for dock-wood ONLY; other V121 premium materials unchanged; original dock() painter, water depth, all 18 pilings and collision remain intact.
3. published-game-capture/v117-jay.js uses the SAME 4×8 original run poses but only in connected-jay moves advances at about 325/31 = 10.5 frames per second rather than 325/22 = 14.8; reduced run/walk switching during acceleration. It loads an optional newly cleaned V126 run PNG only for connected-jay, keeping original game campaign images and animation untouched. Sprite-frame cropping and feet anchor are preserved.
4. tools/clean_v126_run.py removes detached scanline bleed offline using per-frame alpha components. No procedural or synthesized limbs; original WebP sheet unchanged. Fallback to original run sheet if cleaned atlas has not decoded.
5. published-game-capture/v119-water-motion.js reduces high-frequency bobbing, bright footstep bars and sliding artifacts; remains a passive rendering effect under existing movement/physics.

## QA and protected paths
- QA: check-v126-polish.cjs, all V119/V121/V122/V123/V124/V125 regression tests, full isolated V126 build; capture-v126-polish.cjs creates genuine before/after playable screenshots and samples real run poses/positions.
- Game engine game.js, original campaign/vehicle HUD controls.css, outbreak.css, V125 mobile HUD, world geometry v116-marina.js, missions, saves and the entire Zombie mode are unchanged byte-for-byte.
- No new animation loop, input system or World/Canvas renderer, and no revisions to other game modes.

## Limits
The quality pass improves the existing 8-frame run, but fully distinct premium multi-frame leg acting in all perspectives would require new animator-authored run sprites. Current browser emulation tests do not replace physical Android field testing.