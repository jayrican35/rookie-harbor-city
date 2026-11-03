# Approved civilian artwork — connected preview

The connected city now uses the exact yellow, goggle-wearing civilian artwork supplied in `HarborCity_All_30_Civilian_Walking_Atlases.zip`. All 30 RGBA walking atlases (480 frames), original role idles, manifest, and source quality notes are preserved. No replacement art was generated. The two older ZIPs contained different simplified artwork and were not imported.

The supplied atlases contain 128×160 frames in down/left/right/up rows, four frames per direction, with a (64,153) foot anchor. Each production PNG is copied byte for byte and validated for dimensions, transparency, distinct cycle frames and per-frame bounds. The supplied side/back views are composited approximations of the approved artwork; those contours remain unchanged.

## Integration

`published-game-capture/civilian-connected.js` is a small art adapter in the existing connected-world depth queue. It selects a role and frame from an actor's existing identity, facing, movement and traveled distance. Idle actors hold a stable frame. The source anchor is drawn at the existing physical feet; collision, world coordinates, movement speed, routes, interactions, names and dialogue are unchanged. There is no second movement/NPC system or animation timer in the game adapter.

All 32 existing connected-world civilians rendered successfully in coverage testing. The existing jobs and district roles use 22 appropriate outfits; the other eight remain imported and available without spawning extra people. Examples: fishermen use `fisher`; marina workers use `dock_worker`; café staff use `barista`; the bait shopkeeper uses `store_clerk`; the mechanic uses `mechanic`; shoppers, tourists and pedestrians keep stable role assignments across frames.

Police, the player, family and named main characters remain on their existing artwork. The station cast, Diaz and the additional precinct officer layer are explicitly excluded, as are police identities and main-character names. Eleven protected actors in the base registry remain excluded; player rendering occurs before the civilian adapter. The adapter only activates in the new connected preview, never the original campaign or Zombie/Academy modes.

Runtime atlases are loaded lazily when a role is visible. There are at most 30 atlas entries (37.5 MiB of owned decoded RGBA if every role is visited), no per-frame image processing, and no new game loop. Full coverage loaded 22 atlases; normal captured views loaded fewer.

## Verification

- Import validation checks all 30 atlases / 480 frames and records source ZIP and PNG hashes in `asset-validation.json`.
- Adapter tests sample all 480 role/direction/frame combinations, source-row selection, idle hold, constant foot anchors, immutable actors, protected names/IDs and mode guards.
- Browser checks confirm identical actor identities, population, speeds, route arrays, interaction text and physical geometry before/after, with no browser exceptions.
- All 32 existing civilians were visited and rendered with their assigned art; no protected actors appeared in civilian draw records. This includes the four interior staff in their existing rooms.
- Ordinary input passes the Bayview and Marina pier routes and the relocated shop entrance/exit. Mobile pointer joystick movement passes.
- Desktop 1280×800 and portrait 390×844 matching gameplay screenshots cover waterfront, marina, precinct, Downtown and Midtown. Headless samples were 58.4 → 60 FPS desktop and 60 → 60 FPS portrait at matching camera/zoom. These short samples do not establish a physical-phone benchmark.
- Zombie startup, seeded map and connected-world exclusion match. No civilian atlas requests occur before connected play or in Zombie mode.
- Engine, Zombie stylesheet, Marina geometry/routines, Jay and NPC walk renderers, precinct art and canonical road graph match `943065e` after Git line-ending normalization. Existing campus and depth regression checks pass. Game version numbers are unchanged.

Open the [local connected preview](http://127.0.0.1:8767/) or [all-30 outfit viewer and before/after evidence](http://127.0.0.1:8767/evidence/civilian-preview/). The viewer exposes every direction/frame and the original PNGs. Original campaign visuals remain unchanged. Everything is local; nothing was pushed or published.

## Files and reproduction

The exact assets are in `published-game-capture/assets/civilian-approved/`. The importer is `tools/import_civilian_atlases.py`; build/review tooling is `tools/prepare_civilian_preview.py` and `tools/civilian_preview_review.html`; the optional all-30 evidence viewer is `tools/civilian_atlas_gallery.html`. The original pack metadata is archived under `source-pack` as provenance; its suggested new schedules/actions were not added to this artwork-only change.

With the current local waterfront build and server available:

```text
python tools/import_civilian_atlases.py
node qa/check-civilian-adapter.cjs
python tools/prepare_civilian_preview.py
node qa/check-civilian-preview.cjs
node qa/check-civilian-coverage.cjs
python tools/package_civilian_preview.py
node qa/check-civilian-review.cjs
```

Browser checks require Playwright and Chrome. Physical-device testing and any refinement of the supplied composite profile artwork remain future work.
