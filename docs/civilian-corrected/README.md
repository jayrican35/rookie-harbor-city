# Corrected yellow-civilian artwork

**Current result: 26 outfits enabled; 4 held.** Chef, Construction Worker, Artist and Child each have all four front-facing hats clipped by the source PNG's top edge. The individually supplied frame files are identical to those clipped atlas cells. These roles are excluded from playback; the one existing NPC assigned to Construction Worker keeps the previous coherent artwork. The other 31 existing civilians use the corrected yellow set. The viewer labels the four held roles instead of playing them. Only these 16 front frames need further source correction; see `held-frames.json`.

The new `HarborCity_All_30_ApprovedStyle_Civilian_Atlas_Pack.zip` replaces the withdrawn, visibly defective walk set. Its artist-rendered base has complete gloves, attached arms and legs, coherent clothing, and transparent negative space between limbs. All 30 roles and four directions were reviewed on checkerboard, with enlarged samples of resident, vendor, dock worker and student. The original defective pack remains disabled and is never requested by the current preview.

This ZIP changes the source cells to **192×240**, with feet at **(96,225)**. It cannot use the old frame geometry. The importer reads and validates that layout, preserves the original 30 atlas PNGs under `source/atlases`, and exports each complete cell at 128×160 with feet at (64,150). The runtime reads frame size, anchor, role names and file paths from the new metadata instead of assuming the rejected pack's layout. No frame is sliced using the old dimensions.

The offline export uses nearest-neighbor resampling and removes only tiny detached horizontal header fragments outside the sprite envelope. It verifies that alpha below source row 40—including every hand and leg—is identical before resampling. It does not paint hands, recolor anatomy, fill gaps or erase limbs. Source/runtime hashes and frame bounds are recorded in `validation.json`.

The pack author describes the 29 wardrobe variations as adaptations of a common vendor pilot, with modular headwear. They are used as supplied; this is not a claim of 30 individually painted turnarounds. No image generation was used for this corrected import. The earlier generation attempts did not produce replacement art.

## Scope and verification

The change applies only to the connected preview. Police, family, main characters, the original campaign and Zombie mode keep their existing artwork. The same actor objects, routes, speed, dialogue, interactions, geometry and physical feet remain authoritative. The adapter only replaces the existing depth-queue draw operation.

- All 480 source frames were checked for dimensions, alpha, bounds and cycle layout; 16 clipped front frames are recorded and held. Adapter tests exercise all 30 roles, four directions, four frames, stable idle, immutable actors and protected identities.
- Browser tests compare the complete before/after actor configuration, interactions and geometry. Gameplay includes pier walks, shop entry/exit and mobile movement.
- Coverage visits all 32 existing civilians, including indoor staff, confirming 31 corrected renders and one coherent fallback for the held construction outfit. Eleven protected base-registry actors are excluded; player and additional precinct officer paths are also protected.
- The 32 civilians have 22 role assignments. The viewer enables 26 source outfits and labels four held source roles, without adding people or crowding the docks.
- Corrected and withdrawn assets use separate folders and readiness records. The withdrawn asset folder is never requested by the current game. Protected source hashes and seeded Zombie checks are retained with the evidence.

Open the [playable preview](http://127.0.0.1:8767/) and [corrected atlas viewer and gameplay evidence](http://127.0.0.1:8767/evidence/civilian-corrected/). The enlarged checkerboard view makes hands and limb transparency visible. Physical-phone testing remains outstanding; performance samples in `evidence/results.json` use headless Chrome with emulated mobile dimensions.

## Files and reproduction

Runtime assets: `published-game-capture/assets/civilian-corrected/`. Runtime adapter: `published-game-capture/civilian-connected.js`. Original PNGs and supplied metadata are preserved in `source/`; source instructions are provenance, not new requirements to add schedules or NPCs. Version numbers, mission systems, world geometry and population remain unchanged. Everything remains local; no push or deployment occurred.

```text
python tools/import_corrected_civilians.py
node qa/check-civilian-adapter.cjs
python tools/prepare_civilian_preview.py --candidate
```

For a staged review, set `CIVILIAN_AFTER_PREVIEW=civilian-candidate` when running `qa/check-civilian-preview.cjs` and `qa/check-civilian-coverage.cjs`. After visual checks, the corrected readiness record enables the normal preview build:

```text
python tools/prepare_civilian_preview.py
node qa/check-civilian-preview.cjs
node qa/check-civilian-coverage.cjs
python tools/package_corrected_civilians.py
node qa/check-civilian-review.cjs
node qa/check-civilian-art-hold.cjs
```
