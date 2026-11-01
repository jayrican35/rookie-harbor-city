# ROOKIE: Harbor City — V120 Southbay Premium Visual Reconstruction

Implementation branch: feature/v120-marina-premium-visual-conversion, based on verified V119 at 92a24c044b7b1e6475610860dde2aed0a8db1d74.

## Actual production files
- Offline reproducible atlas generator: tools/generate_v120_marina_art.py (Pillow / numpy; never part of runtime).
- Actual generated image resources in published-game-capture/assets/v120-marina/:
  water-body.png, water-caustics.png, water-reef.png, dock-wood.png,
  dock-post.png, foam-frames.png, seawall-light.png, tree-shadows.png.
- Actual in-engine material renderer: published-game-capture/v120-marina-art.js.
- Existing V116 canvas module extended: published-game-capture/v116-marina.js.
- Isolated playable site builder: tools/build_v120_preview.py.
- Deterministic checks: qa/check-v120-marina.cjs and CI V120.

## Important technical separation
V120 is an asset-driven water material, not a pasted reference screenshot.
The high-contrast 512px sea atlas is drawn in world-coordinates with layered authored wave facets. A 512px caustic atlas carries irregular loop contours, duplicated and moved at very low parallax; shallow submerged vegetation/rocks fades outside the nearshore water. Foam is a 4-frame real RGBA sprite sheet positioned on boat bodies, pilings, and seawall. Fitted 90px-wide dock wood planks replace plain 32px tile rectangles. Real alpha pixel-art dock posts and inset wall lights replace their old placeholder shapes. Dappled tree-shadow masks enhance land.

The existing V116 frame begins water painting *before* static terrain and piers; water portions of old cached terrain chunks are left transparent when V120 is installed. Existing collision, geometry and cache allocation remain unchanged. V120 fits physical piers x=4655,5105,5555 at world y=3800..4100; map origin (4400,3220) is unchanged. The V119 loose-wave and V116 streaks are disabled while V120 is active so they cannot muddy the material. Original V119 footstep effects remain. The V118 HUD and cinematic overlays remain on the connected city.

The game continues using the existing RAF and camera, one Canvas draw order, existing NPCs, collision geometry, V117 seamless buildings, original character sprites, HUD and saves. V120 never replaces the world or mutates campaign or Zombie Outbreak.

## Proof and limitations
The premium concept render is the artistic benchmark but is not a literal live-game pixel match. Generated textures are original reproducible procedural pixel-art materials, not individually hand-painted illustrations. Actual captured game screenshots, physical Android acceptance, performance and visual inspection still determine whether V120 meets the desired level. A more faithful art-directed sprite atlas / material pass may remain necessary. Do not claim photo-match or physical Android 60 FPS.

All changes restricted to V120 files, V116 marina visual paint integration, and isolated GitHub preview/deployment; no original game.js or outbreak.css or original assets changes. No merge to approved root.
