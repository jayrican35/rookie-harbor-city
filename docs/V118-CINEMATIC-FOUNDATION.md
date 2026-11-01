# ROOKIE: Harbor City — V118 Modern Cinematic Marina Foundation

Status: first production-oriented visual pass on isolated branch \`feature/v118-cinematic-marina-foundation\`. Not merged into the approved root, classic campaign, or preferred hosted game.

## Art direction
Modern premium pixel-art RPG, original Harbor City palette and top-down camera retained. Use original authored pixel assets, controlled lighting gradients, believable soft contact/directional shadows, subtle environmental motion and reduced HUD occlusion. Avoid photorealistic textures, new global renderers and screen-wide blur. The experience must remain readable on mobile portrait.

## Implemented in this first pass
- Reuse the existing connected-world Canvas camera/frame: inject two optional, camera-culled V118 hooks around the V116 marina rendering layers.
- Ground pass adds restrained building shadow direction and stable, low-opacity dappled sunlight beneath trees/palms. Interior roofs are honored; no shell shadows when fully revealed.
- Atmosphere pass adds a localized, subtle warm-to-cool gradient and small animated radial blooms from the five existing promenade lamps. It clips to the 1,500×1,000-unit Southbay footprint and respects viewport and zoom. No new assets, renderer, shader pipeline or animation loop.
- \`prefers-reduced-motion\` freezes the subtle lighting and dappled-motion phase.
- Compact HUD presents smaller identity and map cards, removes redundant case card (the working Case File button remains), keeps all four existing actions, and hides quick family portraits behind an accessible toggle with \`aria-expanded\` and Escape dismissal.
- Retain V117 seamless interiors, NPC routines, ambient water/boat/foliage animation, physical furniture/collision, directional Jay sprite, MAPS/quests/saves and original assets.

## Architecture and verification
- New: \`published-game-capture/v118-cinematic.js\`, \`v118-cinematic.css\`
- Narrow render-pass integration in \`v115-campus.js\`.
- New isolated preview builder: \`tools/build_v118_preview.py\`, composed on top of the V117 existing build chain.
- New regression tests and GitHub Actions CI gate ensure camera culling, balanced Canvas state, proper build wiring, gameplay regression, and allowed-file diff scope.
- Original \`game.js\`, \`outbreak.css\`, Zombie Outbreak maps/music/AI/controls/assets/balance, and original source asset files are unchanged. No new network, persistence, dependencies or simulation loop.

## Honest limitations / next acceptance gates
1. This is a **first visual foundation**, not the full cinematic overhaul. It does not yet introduce shadow maps, day/night cycles, gameplay camera cinematics, new character animation frames, or additional interiors.
2. Run CI and inspect live screenshots at fixed world coordinates. Check that lighting is understated and shadow geometry does not obscure doors or other actors.
3. Visually inspect mobile portrait and landscape, confirm buttons are not overlapping and family toggle is touch-accessible.
4. Measure sustained FPS, frame pacing, temperature and battery on a physical Android phone; headless viewport QA does not establish that.
5. Keep changes in an isolated preview. Approve visually before merging or replacing the preferred production build.

## Future follow-up within V118
- Consistent props/character scale and palette study.
- Localized light occlusion around roof/wall geometry.
- Additional physically readable character contact shadows and ambient animation.
- Unified scene-state boundary between original campaign and connected world, without touching Zombie Outbreak.
