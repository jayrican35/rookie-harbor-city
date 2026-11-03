# Codex — Implement civilian walking atlases (LOCAL ONLY)

Inspect the repository before changes, including how character sprites are rendered and updated. Do not add a competing renderer.

Assets: `atlases/<role>_walk_4dir.png` and `manifest.json`. The atlas is 4 rows × 4 columns, frame 128×160; row order down, left, right, up. Foot anchor `(64,153)`. Use 7 FPS to start and tune against player speed. Keep consistent in-world body size across all roles.

Use existing NPC movement/collision and interactions. Give each civilian a stable identity, assigned district, home/work coordinates, time-of-day schedule and small weighted task pool with cooldowns. Reuse existing routing. Vary behaviors: gardener waters shrubs, fisher casts at pier, shopkeeper opens and closes stall, musician plays, tourist photographs silly objects, janitor sweeps, delivery courier delivers parcels, children chase balls, elder rests, dock worker handles crates, etc. Pair occasional NPC social reactions, but do not crowd routes or block building entrances. Never fabricate functioning systems in the completion report.

Review `previews/` first. Character-specific front art is preserved; other directions are derived/reconstructed and may require polish. Do not force-import visually defective variants without user approval. QA across all four directions, sprite transparency, anchor alignment, mobile performance and nearest-neighbor zoom, including extreme zoom for teeth and glove fingers.

**Protected:** Local-only changes/builds/tests/commits. Do not push, deploy, open PRs, modify version numbers or touch Zombie Outbreak code, assets, maps or settings. Preserve the seamless single-world architecture and family/Chicken & Banana characters. Police NPCs are excluded.
