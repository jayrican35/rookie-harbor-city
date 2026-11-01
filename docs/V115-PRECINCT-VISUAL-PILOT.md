# V115 Visual Workflow Reset — Precinct 9 Tilemap Pilot

## Source audit (before implementation)

The V115 exterior is currently a **hybrid renderer**:

- A continuous **HTML Canvas 2D** world (`v115-campus.js`) using `drawCampusGround`, `drawLinkedDistricts`, `districtDecor`, and `drawOutdoorDecor` to paint roads, surfaces, decorations and officer silhouettes with procedural geometry.
- Original approved **WebP building and object sprites** (`assets/exterior/*`, `assets/midtown/*`, `assets/maple-court/*`), frequently drawn via `drawImage` with Canvas fallbacks.
- Additional optional **SVG sprite and procedural art overlays** (`v115-showcase.js`, `v115-reference-art.js`, `v115-premium-art.js`).
- No reusable authored 32×32 raster tilemap/atlas loader for exterior ground. Map geometry and camera live in the original engine's private scope; V115 extensions are inserted into a preview-only bundle.
- The main game's `game.js` is still large and intertwined, so the safest step is a *render-only adapter*, not another engine rewrite.

## Chosen pilot

**Precinct 9 west public garden / promenade**, `harbor-main` world `x=352..991`, `y=1300..1683` (20×12 tiles at 32 world units each). This is grounds outside the rebuilt station, above Harbor Avenue. This does not relocate the station or modify street connectivity, character movement, missions, car systems, collision or world IDs.

## Actual asset pipeline

- **Raster tile atlas**: `assets/v115-precinct-pilot/precinct-ground-atlas.png`, 256×128 with 32 individual 32×32 cells. Texture-only crops from the **user-supplied October 31 visual reference** (grass, sidewalk, pavers, flowers) are used as an art-direction pilot, not as final redistributable commercial tiles. The source screenshot itself is *not* displayed as a world overlay.
- **Authored tilemap data**: JSON records tile IDs for ground and garden-border layers, separate from world geometry and gameplay, plus image-backed prop layers and one small lamp animation configuration.
- **Approved game assets**: exactly existing recovered sprite files: `assets/exterior/shade_tree.webp`, `palm.webp`, `bench.webp`, `flower_planter.webp`, `lamp.webp`. They remain owned by the original game; the pilot only references the files, without copying or redrawing their artwork.
- **Reusable renderer**: `v115-precinct-pilot.js` loads and validates the manifest once, caches prerendered tile layers in a single offscreen bitmap, culls the region and props by viewport, switches off tiny animated accents at distant zoom, preserves pixel edges and gracefully handles missing optional sprites.
- **Visual stacking**: ground tilemap after the existing ground but before static world scenery, props after environmental objects but before player actors, tiny lamp glow after character render. This is an *optional* adapter; no collision or gameplay mutation.
- **Mobile QA**: camera fixed at world `672,1480`, zoom `0.80` at 390×844 mobile viewport. Automated before/after shots capture the real Canvas, not the UI; both use **identical coordinates and zoom**. A debug camera hook exists only when `?pilotQA=1` is present on this isolated preview.

## Acceptance gates

1. One area only, no citywide redesign. Artist-approved asset reuse and reusable atlas + map data must be verifiable.
2. Before/after screenshots from actual browser and same camera, no debug overlay.
3. No changes to original `game.js`, `outbreak.css`, or any Zombie Outbreak source/assets; no changes to world layout, collision, navigation, missions, cars, saves, or external server state.
4. Test at 390×844 Android-sized viewport and verify WebP/PNG asset loading, pixel rendering, camera/zoom, original map button, normal return to game.
5. Regression testing and manual device review before any branch merge. Do not merge by default.

## What remains for rollout

- Artist review of tile materials against the user reference and confirmation of rights for commercial use of screenshot-derived texture crops.
- Dedicated, licensed/reusable final tilesets at consistent 16- or 32-pixel art scale, plus maintained tile registry and export process.
- Align object footprints to collision only after design approval; depth-sort NPCs and props in a shared stage.
- Replace the original main-game district map backgrounds only after integrating this safe adapter with the established world chunk renderer.
- Separate performance budget for low-end Android, preloading, optional animations and memory limits.

**Release status:** this is a visual-quality pilot, not a fully integrated main-game tilemap or multiplayer release.