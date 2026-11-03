# CODEX — LOCAL IMPORT DIRECTIVE

Repository: jayrican35/rookie-harbor-city

**ALL CHANGES REMAIN LOCAL UNTIL APPROVAL.** No push, PR, merge, deploy, hosted update or version bump.

First read README_FIRST.md, manifest.json, and docs/QA_REPORT.json. Inspect the current renderer, camera, mobile controls, NPC architecture and collision/navigation systems before touching source code.

Add PNG atlases to the game's existing asset pipeline; don't duplicate the NPC renderer. Each atlas is 768×960 with 4×4 uniform cells, each 192×240. Rows (top to bottom): down, left, right, up; columns: walking frames 0–3. Recommended animation: 7 fps, foot anchor (96,225). Render with correct scaling and transparency.

Use manifest role IDs for 30 civilians only; do not replace police/detectives, playable family characters, Chicken & Banana or protected modes. Prototype in a local test street and check body occlusion, foot anchors, zoom behavior, collision and performance in mobile portrait.

Extend existing civilian AI with idle/walk/work/socialize/react/rest/schedule states, weighted role habits and cooldowns; distribute civilians along actual walkable city routes with zone capacity limits. Avoid NPCs blocking doors or walking through buildings, vehicles, people or water. Use routines and rare_habit fields from manifest as examples; never claim these are already implemented by loading sprites.

Test all 30 roles in 4 directions. Confirm hand/glove integrity, visible legs and no dark void between legs at normal scale and zoom. Expect some specialty outfits to need a hand-art refinement; log any mismatch in side/back views instead of painting more layers blindly.

Preserve Zombie Outbreak maps, mechanics, settings, controls, assets, and balancing. Do not touch it. Preserve seamless world and existing driving/lighting.

End with a local-only report listing changed files, actual test results, unfinished artistic issues, and confirmation nothing went remote.
