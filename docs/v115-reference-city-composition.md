# V115 — Harbor City reference-guided composition, pass 1

## Authoritative reference
The user's **1536 × 768** Harbor City world map image, uploaded in the Game Development project on October 31, 2026, is the visual north star. It shows a lively north mountain band, a northwest waterfall, colorful leafy neighborhoods WEST/MAPLE/NORTH, Precinct 9 near Midtown, denser Downtown, East and Industrial, and a lush southern Marina/Waterfront. Use the image itself for comparison on **every future art pass**. Do not invent a new layout independent of the playable world. If the user image is not available in a future agent session, request access to the Project attachment rather than substituting a vaguely similar picture.

## What this pass actually implements
1. A real-world-coordinate natural environment **under** existing rendered districts: northwest waterfall/river, northeastern mountain silhouettes, forest groves, and a jagged coast with breaking surf. All use the original `harbor-main` world bounds (-3100 to 9656, 0 to 4680).
2. A southern civic park with a lagoon and family gathering area. New landmarks at stable coordinates include the Marina, piers, boats and a lighthouse.
3. Reuse **source building footprints** from original district `decors` at distant zoom. No separate fake city image. The same miniatures render in both city atlas and playable single-camera scene.
4. Render-level LOD: tree canopy and mini rooftops at all-city view, more detail when close; view culling for forest regions; no new gameplay physics.
5. Only the `v115-world.js` map and `v115-campus.js` exploration modules receive visual hook calls. The original `game.js`, `outbreak.css`, academy, zombie assets and campaign save logic are byte-for-byte preserved.
6. The new site is staged under `/preview/v115-reference/` with its **own** sandbox-save namespace, distinct from production, V115, and V115-showcase.

## Limitations / honesty
This is *not* a final premium-quality reconstruction of the supplied reference. It is the first genuine geography and citywide composition pass. It still uses code-painted illustrated terrain and the existing district art. A premium pixel-art atlas, per-district commissioned sprites, more complex shorelines, actual collision for decorative environmental objects, full-size building interiors, NPC schedules, mission integration, car driving and real multiplayer remain future stages. The new trees, boats and civic park are visual scenery, **not interactive gameplay objects**. The visible roads and existing connected outdoor route remain functional, but the coastline and mountain silhouettes are not navigable terrain.

## Quality gates
- Source-based roof placement validated using original `MAPS` decoration coordinates.
- The same world-space feature functions feed live exploration and atlas, preserving player/objective geography.
- Local browser smoke tests at phone resolution and full city zoom; node syntax and source integrity checks.
- GitHub preview must validate original engine and Zombie Outbreak `outbreak.css` SHA unchanged.
- Review on phone; do not merge draft branch until approved.

## Next proposed pass
Replace generic geometry with curated/cohesive **handcrafted pixel-art terrain and district assets**, beginning with the water/shoreline, park, mountain/waterfall, and Precinct–Midtown blocks; extend into downtown/marina, and tune zoom LOD. Keep visual reference and collision/interaction parity mandatory.