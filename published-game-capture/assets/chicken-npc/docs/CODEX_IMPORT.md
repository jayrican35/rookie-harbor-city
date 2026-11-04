# Codex — Import Chicken NPC to the MAIN WORLD only

Use the folder assets and `chicken_manifest.json`. This pack is read-only source art, not a replacement engine.

1. AUDIT existing player/NPC sprite loaders, collision, navigation, speech bubbles, event trigger/save flags, and any pre-existing Chicken or Banana assets. Prefer higher quality approved original assets if present.
2. Import the new RGBA walk atlas and portrait crops under existing asset conventions; do not duplicate engines.
3. Implement NPC `npc_chicken` in a safe sidewalk area near Precinct 9. Use proper foot anchor and existing world-to-screen transforms. Do not block the police cruiser or doors.
4. Animate four directions using manifest rows and four columns; use existing NPC movement with normal acceleration and collision. Support idle and an optional argue animation when proximity-triggered.
5. Show short puffy comic speech bubbles (never the old box). Example: “OFFICER! THIS BANANA IS HARASSING ME!” as a test line. Do not create Banana or an untested story cutscene as part of this first import.
6. Validate against zoom, 4 directions, shadow, layering, doorway occlusion, edge halos, walking, mobile portrait, and loading. Run the browser game locally.
7. Do not modify Zombie Outbreak. Keep all edits, tests, assets, and commits LOCAL. No pushes, PRs, merges, deployments, or version increments.
8. Report which assets are used, tests actually run, visual defects, and whether the game remains playable. Stop if the extraction quality does not meet the existing premium-pixel-art standard.
