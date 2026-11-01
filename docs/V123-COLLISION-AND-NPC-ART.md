# ROOKIE V123 — Physical Marina and Clean NPC Animation

Review source: user-uploaded 16.86-second Android gameplay recording November 1 2026. Observations: Jay crosses bin/prop footprints and some pile positions; floating dark horizontal bars above several walking NPCs.

## Findings and implementation
1. V116 marina previously included physical collision mainly for building shells/interior furniture/water; benches, flower planters, lamp bases, bins, palm/tree trunks, chain-link fence, pier posts and ambient NPCs had no appropriate blocking footprints.
2. The V123 connected-world renderer now uses *foot-grounded*, camera-independent prop footprints for all the categories above. Trees/foliage obstruct only around the trunk, not full treetop canopies. Piles are 18 narrow native world-coordinate blockers with the entire central 90px pier walking aisle retained.
3. The same geometry guides moving marina NPCs: if the next route step is blocked, the NPC does not tunnel through it. The visitor's route moves a short distance onto unobstructed pavement.
4. The existing chain-link fence painter now uses gate segments cut around **actual** building doorways, matching exactly the physical fence segments, so solid railings do not make shops inaccessible.
5. V116 NPC 4x4 sprite atlases contained disconnected dark and colored horizontal fragments unrelated to characters. Offline Pillow connected-component cleanup removes stray components frame by frame, preserving the main character silhouettes, poses and attached accessories. V116 walking renderer loads new PNGs from assets/v123-marina-npcs and leaves all original WebP sprites unchanged.
6. Player-to-NPC foot collision prevents walking through other people. It does not change NPC dialogues, quests, campaign saves or Zombie Outbreak.

## Regression and production QA
- qa/check-v123-collision.cjs verifies prop, piling, fence, gate and NPC geometry while retaining pier center, water and external movement.
- Previously straight-through-tree test paths are deliberately updated to use physically passable paths. Separate seamless interior and walk controls tests remain.
- qa/capture-v123-review.cjs will compare actual V122 and V123 Canvas gameplay in a mobile-size Chromium browser, exercising blocked and clear coordinates and recording NPC visuals.
- The isolated preview builder tools/build_v123_preview.py composes from V122 and generates cleaned PNG sheets; no new renderer, engine, state machine or loading scene.

## Protected original
Unchanged original game.js and outbreak.css, shared city movement camera file, all Zombie Outbreak code/maps/controls/assets/balance, existing V121 materials and V122 piling depth. No automatic merge to the original GitHub Pages root.

## Known scope
V123 addresses recorded marina collision footprints and obvious sprite-sheet artifacts. More advanced NPC-to-NPC crowd steering, diagonal continuous sweep, detailed physics for every decor prop and art polish are not claimed. Physical Android performance still needs on-device assessment.
