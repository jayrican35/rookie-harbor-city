# ROOKIE: Harbor City — V119 Visible Waterfront + Character Motion

**Scope:** Option B; concentrated visual upgrade on the connected-world Southbay Marina built on V118.

## Implementation
- Add `v119-water-motion.js` as a small, no-RAF render helper called from the existing V116 marina painter; no duplicate renderer, chunk cache, particles, save system or scene.
- Large animated turquoise/pearl wave crests and sweeping blue depth bands on existing pixel-art water, including stronger turquoise near shore, deep blue offshore, and shoreline foam aligned with the three original pier openings.
- Under-pier shadows and nested moving boat wakes. The boats themselves bob slightly more than before.
- NPCs use their existing sprite sheets with additional small movement-linked body bob and visible alternating footsteps. Jay's existing shared sprite is unchanged; connected-marina-only footsteps and bob are applied by the existing campus draw call.
- All motion follows the existing frame timestamp or walked-distance counters. Reduced-motion preference freezes ambient phases; it does not disable the static sea palette or changes.
- Existing V117 seamless interiors, interactions, collisions, camera, character choice, mission displays and main game source remain unchanged.

## Protection
No changes to `game.js`, `outbreak.css`, original art/audio assets, Zombie Outbreak systems, physics, gameplay, saves, player camera, or native map coordinates. The original playable GitHub Pages root remains unmodified.

## Verification
Run `node qa/check-v119-water-motion.cjs` and the full existing V115/V116/V117/V118 suite; generate an isolated V119 browser build with `tools/build_v119_preview.py`. Compare actual Canvas screenshots from V118 and V119 at the same coordinates and zoom, both 390x844 and 844x390. Profile physical Android performance separately.

## Limitations
This is a more visible water-and-motion pass, not a completely new tile set, new 8-direction actors, physics simulation or day/night system. There are no new sprites. Visual quality is to be assessed from true phone gameplay, not just reference art.