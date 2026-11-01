# ROOKIE: Harbor City — V115 Art Pass 2: Premium Environments

## Purpose
Build toward the owner's **October 31 reference image**: a colorful, lush 1990s-inspired pixel-art coastal city that looks coherent at street-level and at whole-city zoom. This is a real, additive environment implementation for the seamless-world **development preview**, not a replacement of the current playable campaign.

## Committed additions

- Five original, editable SVG environment sprites (`assets/v115-premium`): snowcapped north mountain range, wooded waterfall cliff, working lighthouse silhouette, and two sailing boat variants.
- Upgraded marina: repeatable wood plank piers, bollards, shadow, moored sailboats, warm waterfront lampposts, surf highlights and shoreline micro-detail.
- North/west: mountain and waterfall artwork anchored to the original V115 reference world coordinates, drawn only when in view.
- Downtown / Midtown / Southbay / Eastside: **source-decoration-based** colorful distant building art. Roof footprints are derived from the current `MAPS` decorators, avoiding new fake landmarks unrelated to the actual scene. Original close-up source sprite artwork remains authoritative.
- `v115-premium-art.js` is a visual-only module, offering `terrain` and `overlay` functions used by both the connected playfield and the actual-world atlas.
- The preview has its own `rookie:v115-premium-sandbox:` localStorage namespace, separate from the original game, V115, reference and showcase previews.
- Mobile optimization: near-camera culling, distant LOD, no per-frame image decoding or external third-party asset loads.

## Exact world anchors

| Asset | World X | World Y | Notes |
|---|---:|---:|---|
| Mountain | 7420 | 110 | 2210 × 950 world units; underlying legacy mountain background retained |
| Waterfall | -2830 | 310 | 510 × 590; northwest highlands |
| Lighthouse | 7270 | 4110 | 260 × 380; at southern waterfront |
| Marina boats | 4535–5860 | 4265–4470 | Same dock geography as original V115 Reference Pass 1 |
| Downtown building roofs | Source decor x/y | Source decor x/y | No detached city image; no made-up collision geometry |

## Safety and limitations

**Zombie Outbreak remains untouched:** do not edit original `game.js`, `outbreak.css`, maps, assets, controls, audio, combat, balancing or survival state. The existing production GitHub Pages site, other previews, and original ChatGPT-hosted version also remain unchanged. Keep work on the feature branch with a draft pull request and independent Pages preview.

This is **Art Pass 2**, not the final target quality shown in the user's reference image. The coast/mountain/boats are currently visual scenery; player collisions, NPC schedules, pier interactivity, lighthouse entry, and story/vehicle integration still need future work. Multiplayer IDs/world position contract are preserved, but online multiplayer is not implemented.

## Verification

- Node JS syntax checks for all new and existing V115 visual modules.
- `node qa/check-v115-premium.cjs`, plus existing reference-world, showcase, road, campus and connected-city tests.
- Five SVGs parsed and checked for `<script>`, `javascript:`, foreign object and external HTTP references.
- Phone-sized headless Chromium rendering with new SVGs decoded successfully (5/5), ocean/marina/mountains/downtown screenshots and zero JavaScript errors.
- GitHub diff against `feature/v115-reference-city-composition` verifies `published-game-capture/game.js` and `outbreak.css` unchanged; only allowed V115 art/preview files may change.
- Real on-phone review remains required before any merge or publishing as the game's primary version.

## Next work after the owner's phone review

1. Rework the coastline and lighthouse into authored **multi-tile shoreline chunks**, with water and collision boundaries, animated foam and optional pier interaction.
2. Produce cohesive Midtown/Downtown high-density pixel sprite sheets matching the original user's illustrated reference and source-building positions.
3. Enrich the road-edge transition between Precinct 9 and Midtown, then expand this standard across the rest of the world.
4. Integrate missions, interiors and vehicles into the unified gameworld after environment quality is reviewed.