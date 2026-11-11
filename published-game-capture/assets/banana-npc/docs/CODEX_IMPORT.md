# CODEX IMPORT — BANANA ONLY

Chicken already exists in the local game. **Do not recreate or replace Chicken.**

1. Inspect the working Chicken loader, direction naming, display scaling, NPC placement and collision.
2. Add Banana's sprite atlas, portraits, and manifest to the equivalent asset folders. `banana_walk_4x4.png` uses the **same 112×120 frame size, four row directions (down/left/right/up), four columns, 56×110 foot anchor, and 170 ms frame time** as the Chicken pack.
3. Register `npc_banana` using existing NPC renderer and animation logic. Reuse existing speech-bubble system.
4. Place Banana on an unobstructed sidewalk a few tiles from Chicken for testing; avoid the precinct doors and patrol car.
5. Verify all four walking directions, position at normal and zoomed-out camera scales, pixel edges, no dark halo, collision, portrait crops, and a comic speech bubble. Run local tests and report deficiencies.
6. No new dialogue/camera/physics subsystems. **Zombie Outbreak untouched. All changes local; no push, deploy, PR, or version increment.**

These are reference-extracted pilot art assets, not guaranteed hand-finished production sprites. Report visible defects rather than hiding them.
